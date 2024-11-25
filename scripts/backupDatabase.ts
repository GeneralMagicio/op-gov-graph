// scripts/backupDatabase.ts
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { z } from "zod";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

config({ path: path.join(projectRoot, ".env") });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1)
});

interface BackupConfig {
  backupDir: string;
  maxBackups: number;
  format: "sql" | "sql.gz";
  containerName?: string;
}

async function createBackupDirectory(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function getPostgresContainerName(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      "docker ps --filter 'name=postgres' --format '{{.Names}}'"
    );
    const containerName = stdout.trim();
    if (!containerName) {
      throw new Error("No PostgreSQL container found");
    }
    return containerName;
  } catch (error) {
    console.error("Error finding PostgreSQL container:", error);
    throw error;
  }
}

async function backupDatabase(config: BackupConfig) {
  const env = envSchema.parse(process.env);

  const url = new URL(env.DATABASE_URL);
  const host = url.hostname;
  const port = url.port;
  const database = url.pathname.slice(1);
  const username = url.username;
  const password = url.password;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `backup-${timestamp}.${config.format}`;
  const backupPath = path.join(config.backupDir, backupFileName);

  try {
    await createBackupDirectory(config.backupDir);

    // Get container name if not provided
    const containerName =
      config.containerName || (await getPostgresContainerName());
    console.log(`Using PostgreSQL container: ${containerName}`);

    // Create backup using docker exec
    console.log("Creating database backup...");
    let command: string;

    if (config.format === "sql.gz") {
      command = `docker exec ${containerName} pg_dump -U ${username} ${database} --no-owner --no-acl | gzip > "${backupPath}"`;
    } else {
      command = `docker exec ${containerName} pg_dump -U ${username} ${database} --no-owner --no-acl > "${backupPath}"`;
    }

    const envVars = {
      PGPASSWORD: password,
      ...process.env
    };

    await execAsync(command, { env: envVars });

    // Verify backup size
    const stats = await fs.stat(backupPath);
    const sizeMB = stats.size / 1024 / 1024;

    if (stats.size < 1000) {
      // Less than 1KB is definitely wrong
      throw new Error(`Backup file is too small (${sizeMB.toFixed(2)} MB)`);
    }

    console.log(`Backup completed successfully: ${backupFileName}`);
    console.log(`Backup size: ${sizeMB.toFixed(2)} MB`);

    // Print restore command
    const restoreCommand =
      config.format === "sql"
        ? `psql -U ${username} -d ${database} < "${backupFileName}"`
        : `gunzip -c "${backupFileName}" | psql -U ${username} -d ${database}`;
    console.log("\nTo restore this backup, use:");
    console.log(restoreCommand);

    return backupPath;
  } catch (error) {
    console.error("Backup failed:", error);
    // Clean up failed backup
    try {
      if (
        await fs
          .access(backupPath)
          .then(() => true)
          .catch(() => false)
      ) {
        await fs.unlink(backupPath);
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
    throw error;
  }
}

async function main() {
  const format = process.argv.includes("--compress") ? "sql.gz" : "sql";

  const config: BackupConfig = {
    backupDir: path.join(projectRoot, "backups"),
    maxBackups: 5,
    format
    // You can specify the container name here if auto-detection doesn't work
    // containerName: 'your-postgres-container-name'
  };

  try {
    await backupDatabase(config);
  } catch (error) {
    console.error("Backup process failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === import.meta.resolve(process.argv[1])) {
  main().catch(console.error);
}

export { backupDatabase };

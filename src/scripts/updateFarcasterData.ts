import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

// Load .env file
const result = config({ path: path.resolve(projectRoot, ".env") });

if (result.error) {
  console.error("Error loading .env file:", result.error);
  process.exit(1);
}

// Verify environment variables are loaded
console.log("Environment variables loaded:", {
  DATABASE_URL: process.env.DATABASE_URL ? "[EXISTS]" : "[MISSING]",
  AIRSTACK_API_KEY: process.env.AIRSTACK_API_KEY ? "[EXISTS]" : "[MISSING]"
});

// Initialize database connection
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

// Import services
import { AirstackService } from "../server/services/airStack/airstackService.js";

async function main() {
  try {
    console.log("Starting Farcaster data update...");

    // Get AirstackService instance
    const airstackService = AirstackService.getInstance(db);

    // Update user profiles
    await airstackService.updateAllCitizens();

    // Update following relationships
    console.log("Starting Farcaster followings update...");
    await airstackService.updateAllFarcasterFollowings();

    console.log("Farcaster data update completed successfully");
  } catch (error) {
    console.error("Failed to update Farcaster data:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// If running as a module
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
}

export { main as updateFarcasterData };

// scripts/migrations/migrateDelegatesAgora.ts
import { DelegateService } from "@/server/services/agora/delegateService";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { fileURLToPath } from "url";

const initializeDatabaseConnection = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Log the database URL (without password) for debugging
  const dbUrlForLogging = process.env.DATABASE_URL.replace(
    /:([^:@]+)@/,
    ":***@"
  );
  console.log("Connecting to database:", dbUrlForLogging);

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: false,
    connect_timeout: 10,
    debug: (connection_id, str) => {
      console.log(`[${connection_id}] ${str}`);
    }
  });

  return sql;
};

async function migrateDelegates() {
  const sql = initializeDatabaseConnection();
  const db = drizzle(sql);
  const delegateService = new DelegateService();

  try {
    console.log("Starting delegate migration...");

    // Test database connection
    await sql`SELECT 1`;
    console.log("Database connection successful");

    // Fetch all delegates
    console.log("Fetching delegates from API...");
    const delegates = await delegateService.fetchAllDelegates();
    console.log(`Found ${delegates.length} delegates`);

    // Process delegates in batches
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < delegates.length; i += batchSize) {
      const batch = delegates.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(delegates.length / batchSize)}`
      );

      await Promise.allSettled(
        batch.map(async (delegate) => {
          try {
            await delegateService.upsertDelegate(delegate);
            successCount++;
            if (successCount % 10 === 0) {
              console.log(`Successfully processed ${successCount} delegates`);
            }
          } catch (error) {
            errorCount++;
            console.error(
              `Error processing delegate ${delegate.address}:`,
              error
            );
          }
        })
      );

      // Add delay between batches to prevent rate limiting
      if (i + batchSize < delegates.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("\nMigration Summary:");
    console.log(`Total delegates processed: ${delegates.length}`);
    console.log(`Successful updates: ${successCount}`);
    console.log(`Failed updates: ${errorCount}`);
    console.log("\nDelegate migration completed");
  } catch (error) {
    console.error("Error during delegate migration:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  } finally {
    await sql.end();
  }
}

// Check if file is being run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  migrateDelegates()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateDelegates };

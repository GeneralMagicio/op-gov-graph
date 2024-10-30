import "dotenv/config";

import postgres from "postgres";
import { removeDuplicateLinks } from "../../scripts/migrations/removeDuplicateLinks.js";

// Initialize database connection
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function main() {
  try {
    console.log("Starting duplicate links removal...");
    await removeDuplicateLinks();
    console.log("Completed removing duplicate links");
  } catch (error) {
    console.error("Failed to remove duplicate links:", error);
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

export { main as removeDuplicates };

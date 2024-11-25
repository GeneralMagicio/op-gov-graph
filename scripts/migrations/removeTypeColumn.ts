import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

async function removeTypeColumn() {
  const db = drizzle(postgres(process.env.DATABASE_URL!));

  try {
    console.log("Starting type column removal...");

    // Remove the type column
    await db.execute(sql`
      ALTER TABLE nodes DROP COLUMN IF EXISTS type;
    `);

    // Drop the type_idx index if it exists
    await db.execute(sql`
      DROP INDEX IF EXISTS node_type_idx;
    `);

    console.log("Successfully removed type column and its index");
  } catch (error) {
    console.error("Failed to remove type column:", error);
    throw error;
  }
}

export { removeTypeColumn }; 
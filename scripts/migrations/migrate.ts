import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import pg from "pg";
import dotenv from "dotenv";
import { networks, nodes, nodeTypeEnum } from "@/server/db/schema";

// Load environment variables
dotenv.config();

// Log to debug
console.log("Database URL:", process.env.DATABASE_URL);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 1
});

const db = drizzle(pool);

async function main() {
  try {
    console.log("Starting migrations...");

    // Test database connection
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");

    // Rest of your migration code...
    await migrate(db, { migrationsFolder: "drizzle" });

    console.log("✅ Migrations completed. Inserting initial data...");

    // Insert initial network data
    const [optimismNetwork] = await db
      .insert(networks)
      .values({
        name: "Optimism",
        description: "Optimism Network"
      })
      .returning({ id: networks.id })
      .onConflictDoNothing();

    if (optimismNetwork) {
      console.log("Optimism network inserted");

      const nodeTypes: Array<(typeof nodeTypeEnum.enumValues)[number]> = [
        "Citizen",
        "TECHolder",
        "RegenScore",
        "TrustedSeed",
        "RegenPOAP",
        "Delegate"
      ];

      for (const type of nodeTypes) {
        await db
          .insert(nodes)
          .values({
            id: `sample-${type.toLowerCase()}`,
            networkId: optimismNetwork.id,
            nodeTypes: [type],
            ens: `sample-${type.toLowerCase()}.eth`,
            isDelegate: type === "Delegate"
          })
          .onConflictDoNothing();
        console.log(`Sample ${type} node inserted`);
      }
    } else {
      console.log(
        "Optimism network already exists, skipping sample data insertion"
      );
    }

    console.log("✅ Migration and initial data insertion completed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Error in migration:", error);
  process.exit(1);
});

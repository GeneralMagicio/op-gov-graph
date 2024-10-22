// src/db/migrate.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import dotenv from "dotenv";
import { networks, nodes, nodeTypeEnum } from "../schema";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const db = drizzle(pool);

async function main() {
  console.log("Migration started");

  // Run the migrations
  await migrate(db, { migrationsFolder: "./src/db/migrations" });

  console.log("Migrations completed. Inserting initial data...");

  // Insert initial network data
  const [optimismNetwork] = await db
    .insert(networks)
    .values({
      name: "Optimism",
      description: "Optimism Network"
    })
    .returning({ id: networks.id });

  console.log("Optimism network inserted");

  // Insert a sample node for each node type
  const nodeTypes: Array<(typeof nodeTypeEnum.enumValues)[number]> = [
    "Citizen",
    "TECHolder",
    "RegenScore",
    "TrustedSeed",
    "RegenPOAP"
  ];

  for (const type of nodeTypes) {
    await db.insert(nodes).values({
      id: `sample-${type.toLowerCase()}`,
      networkId: optimismNetwork.id,
      type: type,
      ens: `sample-${type.toLowerCase()}.eth`
      // Add other required fields here
    });
    console.log(`Sample ${type} node inserted`);
  }

  console.log("Migration and initial data insertion completed");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed");
  console.error(err);
  process.exit(1);
});

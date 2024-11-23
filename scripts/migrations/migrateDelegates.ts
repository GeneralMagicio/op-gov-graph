import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { eq } from "drizzle-orm";

import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { NodeType } from "@/app/graph/types";
import { nodes } from "@/server/db/schema";

// Load environment variables
dotenv.config();

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Log the database URL (without password) for debugging
const dbUrlForLogging = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":***@");
console.log("Connecting to database:", dbUrlForLogging);

export interface DelegateData {
  ensAddress: string;
  farcasterUrl: string;
  twitterUrl: string;
  roles: string;
  ambassadorOf: string;
  opRewardsEarned: string;
  isDelegate: boolean;
  description: string;
  id: string;
}

async function migrateDelegates() {
  const sql = postgres(process.env.DATABASE_URL!, {
    max: 1,
    ssl: false,
    // Add connection timeout
    connect_timeout: 10,
    // Add debug logging
    debug: (connection_id, str) => {
      console.log(`[${connection_id}] ${str}`);
    }
  });

  const db = drizzle(sql);

  try {
    console.log("Starting delegate migration...");

    // Test database connection
    await sql`SELECT 1`;
    console.log("Database connection successful");

    // Load delegates data
    const delegatesPath = path.join(
      process.cwd(),
      "public/data/delegates.json"
    );
    console.log("Loading delegates from:", delegatesPath);

    const delegatesContent = await fs.readFile(delegatesPath, "utf-8");
    const delegates: DelegateData[] = JSON.parse(delegatesContent);
    console.log(`Loaded ${delegates.length} delegates`);

    for (const delegate of delegates) {
      const existingNode = await db
        .select()
        .from(nodes)
        .where(eq(nodes.id, delegate.id.toLowerCase()))
        .limit(1);

      if (existingNode.length > 0) {
        // Update existing node
        const currentNode = existingNode[0];
        const nodeTypes = [...(currentNode.nodeTypes || [])];

        if (!nodeTypes.includes(NodeType.Delegate)) {
          nodeTypes.push(NodeType.Delegate);
        }

        await db
          .update(nodes)
          .set({
            nodeTypes,
            ensAddress: delegate.ensAddress,
            farcasterUrl: delegate.farcasterUrl,
            twitterUrl: delegate.twitterUrl,
            roles: delegate.roles,
            ambassadorOf: delegate.ambassadorOf,
            opRewardsEarned: delegate.opRewardsEarned,
            isDelegate: true,
            description: delegate.description,
            updatedAt: new Date()
          })
          .where(eq(nodes.id, delegate.id.toLowerCase()));

        console.log(`Updated existing node with delegate data: ${delegate.id}`);
      } else {
        // Create new node
        await db.insert(nodes).values({
          id: delegate.id.toLowerCase(),
          networkId: 10, // Optimism network
          nodeTypes: [NodeType.Delegate],
          ensAddress: delegate.ensAddress,
          farcasterUrl: delegate.farcasterUrl,
          twitterUrl: delegate.twitterUrl,
          roles: delegate.roles,
          ambassadorOf: delegate.ambassadorOf,
          opRewardsEarned: delegate.opRewardsEarned,
          isDelegate: true,
          description: delegate.description
        });

        console.log(`Created new node with delegate data: ${delegate.id}`);
      }
    }

    console.log("Delegate migration completed successfully");
  } catch (error) {
    console.error("Error during delegate migration:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        ...(error as any)
      });
    }
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration
if (import.meta.url === import.meta.resolve(process.argv[1])) {
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

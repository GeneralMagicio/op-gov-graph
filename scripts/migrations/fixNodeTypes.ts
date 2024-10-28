#!/usr/bin/env node

// @ts-check
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as fs from "fs/promises";
import * as path from "path";

import dotenv from "dotenv";
import { NodeType } from "@/app/graph/types";
import { nodes } from "@/server/db/schema";

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const dbUrlForLogging = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":***@");
console.log("Connecting to database:", dbUrlForLogging);

async function fixNodeTypes() {
  const sql = postgres(process.env.DATABASE_URL!, {
    max: 1,
    ssl: false,
    connect_timeout: 10,
    debug: (connection_id, str) => {
      console.log(`[${connection_id}] ${str}`);
    }
  });

  const db = drizzle(sql);

  try {
    console.log("Starting node types fix...");

    // Load both citizens and delegates data
    const citizensPath = path.join(
      process.cwd(),
      "public/data/CitizensWithoutFarcasterDataField.json"
    );
    const delegatesPath = path.join(
      process.cwd(),
      "public/data/delegates.json"
    );

    const [citizensContent, delegatesContent] = await Promise.all([
      fs.readFile(citizensPath, "utf-8"),
      fs.readFile(delegatesPath, "utf-8")
    ]);

    // Create Sets for easy lookup
    const citizens = new Set(
      JSON.parse(citizensContent).map((c: any) => c.id.toLowerCase())
    );
    const delegates = new Set(
      JSON.parse(delegatesContent).map((d: any) => d.id.toLowerCase())
    );

    console.log(
      `Loaded ${citizens.size} citizens and ${delegates.size} delegates`
    );

    // Get all nodes
    const allNodes = await db.select().from(nodes);
    console.log(`Processing ${allNodes.length} nodes`);

    // Process each node
    for (const node of allNodes) {
      const nodeTypes: NodeType[] = [];
      let primaryType: NodeType = node.type as NodeType;
      const nodeId = node.id.toLowerCase();

      // Handle special nodes first
      if (node.isSpecial) {
        switch (node.id) {
          case "TECHolder":
            primaryType = NodeType.TECHolder;
            nodeTypes.push(NodeType.TECHolder);
            break;
          case "RegenScore":
            primaryType = NodeType.RegenScore;
            nodeTypes.push(NodeType.RegenScore);
            break;
          case "TrustedSeed":
            primaryType = NodeType.TrustedSeed;
            nodeTypes.push(NodeType.TrustedSeed);
            break;
          case "RegenPOAP":
            primaryType = NodeType.RegenPOAP;
            nodeTypes.push(NodeType.RegenPOAP);
            break;
        }
      } else {
        // Handle regular nodes
        const isCitizen = citizens.has(nodeId);
        const isDelegate = delegates.has(nodeId);

        // If node is in Citizens.json, it should be a Citizen type
        if (isCitizen) {
          primaryType = NodeType.Citizen;
          nodeTypes.push(NodeType.Citizen);

          // If it's also a delegate, add Delegate to types
          if (isDelegate) {
            nodeTypes.push(NodeType.Delegate);
          }
        } else if (isDelegate) {
          // If it's only a delegate (not in Citizens.json)
          primaryType = NodeType.Delegate;
          nodeTypes.push(NodeType.Delegate);
        }

        // Log changes when fixing incorrectly set types
        if (node.type === NodeType.Delegate && isCitizen) {
          console.log(
            `Fixing node ${nodeId}: Was incorrectly set to Delegate, restoring to Citizen`
          );
        }
      }

      // Update the node
      await db
        .update(nodes)
        .set({
          type: primaryType,
          nodeTypes: nodeTypes,
          updatedAt: new Date()
        })
        .where(eq(nodes.id, nodeId));

      console.log(
        `Updated node ${nodeId}: type=${primaryType}, types=[${nodeTypes.join(
          ", "
        )}]`
      );
    }

    console.log("\nNode types fix completed successfully");
  } catch (error) {
    console.error("Error during node types fix:", error);
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

// Run migration if executed directly
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  fixNodeTypes()
    .then(() => {
      console.log("Fix completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fix failed:", error);
      process.exit(1);
    });
}

export { fixNodeTypes };

import { createPublicClient, http, PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { db } from "../../src/server/db";
import { nodes } from "../../src/server/db/schema";
import { eq, isNull, and, not, or } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env"
});

if (!process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL) {
  throw new Error(
    "NEXT_PUBLIC_ALCHEMY_RPC_URL is not defined in environment variables"
  );
}

// Add retry logic to the transport
const transport = http();

const publicClient = createPublicClient({
  chain: mainnet,
  transport
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveENS(
  address: string,
  retries = 3
): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const ensName = await publicClient.getEnsName({
        address: address as `0x${string}`
      });
      return ensName;
    } catch (error) {
      console.error(
        `Attempt ${i + 1}/${retries} failed for ${address}:`,
        error
      );

      if (i < retries - 1) {
        // Exponential backoff: wait longer between each retry
        const delay = Math.pow(2, i) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await sleep(delay);
      } else {
        return null;
      }
    }
  }
  return null;
}

async function updateNodesENS() {
  console.log("Starting ENS update for nodes...");

  const nodesWithoutENS = await db
    .select()
    .from(nodes)
    .where(or(isNull(nodes.ens), not(eq(nodes.isSpecial, true))));

  console.log(`Found ${nodesWithoutENS.length} nodes without ENS`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  // Process in smaller batches
  const BATCH_SIZE = 10;
  for (let i = 0; i < nodesWithoutENS.length; i += BATCH_SIZE) {
    const batch = nodesWithoutENS.slice(i, i + BATCH_SIZE);

    // Add a delay between batches
    if (i > 0) {
      await sleep(2000); // 2 second delay between batches
    }

    for (const node of batch) {
      if (!node.id) {
        skipped++;
        continue;
      }

      const ensName = await resolveENS(node.id);

      if (ensName) {
        try {
          await db
            .update(nodes)
            .set({ ens: ensName })
            .where(eq(nodes.id, node.id));
          updated++;
          console.log(`Updated ENS for ${node.id} to ${ensName}`);
        } catch (error) {
          console.error(`Failed to update database for ${node.id}:`, error);
          failed++;
        }
      }

      // Add a smaller delay between individual requests
      await sleep(500);
    }
  }

  console.log(`
ENS Update Summary:
- Total nodes without ENS: ${nodesWithoutENS.length}
- Successfully updated: ${updated}
- Skipped (no address): ${skipped}
- Failed updates: ${failed}
- No ENS found: ${nodesWithoutENS.length - updated - skipped - failed}
`);
}

// Run the migration
updateNodesENS()
  .catch((error) => {
    console.error("Error running ENS update:", error);
    process.exit(1);
  })
  .finally(() => process.exit(0));

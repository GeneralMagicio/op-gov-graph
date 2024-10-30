import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { badgeHolders } from "../../src/server/db/schema";
import { inArray } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: false,
  connect_timeout: 10,
  debug: (connection_id, str) => {
    console.log(`[${connection_id}] ${str}`);
  }
});

const db = drizzle(sql);

async function removeDuplicateBadgeHolders() {
  try {
    console.log("Starting duplicate badge holders removal process...");

    const allBadgeHolders = await db
      .select({
        id: badgeHolders.id,
        recipient: badgeHolders.recipient,
        referredBy: badgeHolders.referredBy,
        rpgfRound: badgeHolders.rpgfRound,
        attester: badgeHolders.attester,
        referredMethod: badgeHolders.referredMethod,
        createdAt: badgeHolders.createdAt
      })
      .from(badgeHolders);

    console.log(`Found ${allBadgeHolders.length} total badge holders`);

    const uniqueKeyMap = new Map();
    const duplicateIds = new Set<number>();
    const keepIds = new Set<number>();

    allBadgeHolders.forEach((holder) => {
      const key = `${holder.referredBy ?? "null"}-${holder.recipient}-${holder.rpgfRound}`;

      if (!uniqueKeyMap.has(key)) {
        uniqueKeyMap.set(key, holder);
        keepIds.add(holder.id);
      } else {
        const existing = uniqueKeyMap.get(key);
        if (holder.createdAt < existing.createdAt) {
          duplicateIds.delete(existing.id);
          keepIds.delete(existing.id);
          duplicateIds.add(existing.id);
          keepIds.add(holder.id);
          uniqueKeyMap.set(key, holder);
        } else {
          duplicateIds.add(holder.id);
        }
      }
    });

    console.log(`Found ${duplicateIds.size} duplicate badge holders`);
    console.log(`Keeping ${keepIds.size} unique badge holders`);

    if (duplicateIds.size > 0) {
      const batchSize = 100;
      const duplicateIdsArray = Array.from(duplicateIds);

      for (let i = 0; i < duplicateIdsArray.length; i += batchSize) {
        const batch = duplicateIdsArray.slice(i, i + batchSize);

        await db.delete(badgeHolders).where(inArray(badgeHolders.id, batch));

        console.log(`Deleted batch of ${batch.length} duplicate badge holders`);

        if (i + batchSize < duplicateIdsArray.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log("Successfully removed all duplicate badge holders");
    } else {
      console.log("No duplicates found");
    }
  } catch (error) {
    console.error("Error removing duplicate badge holders:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

removeDuplicateBadgeHolders()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, inArray } from "drizzle-orm";
import * as fs from "fs/promises";
import * as path from "path";

import * as schema from "../../src/server/db/schema";
import { NodeType } from "../../src/app/graph/types";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function loadJsonFile(filename: string) {
  const filePath = path.join(process.cwd(), "public", "data", filename);
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

async function checkLinkExists(sourceId: string, targetId: string, type: string) {
  const existingLink = await db
    .select()
    .from(schema.links)
    .where(
      and(
        eq(schema.links.sourceId, sourceId),
        eq(schema.links.targetId, targetId),
        eq(schema.links.type, type)
      )
    )
    .limit(1);

  return existingLink.length > 0;
}

async function linkDelegateNodes() {
  try {
    console.log("Starting to link delegate nodes...");

    // First, load and insert TrustedSeed members
    console.log("Loading TrustedSeed members from JSON...");
    const trustedSeedMembers = await loadJsonFile("TrustedSeed.json");
    console.log(`Found ${trustedSeedMembers.length} TrustedSeed members in JSON`);

    // Insert TrustedSeed members into the database
    for (const member of trustedSeedMembers) {
      const lowercaseId = member.id.toLowerCase();
      try {
        await db
          .insert(schema.trustedSeeds)
          .values({
            id: lowercaseId
          })
          .onConflictDoNothing();
        console.log(`Added/Verified TrustedSeed member: ${lowercaseId}`);
      } catch (error) {
        console.error(`Error inserting TrustedSeed member ${lowercaseId}:`, error);
      }
    }

    // Load and insert RegenPOAP holders
    console.log("Loading RegenPOAP data from JSON...");
    const regenPOAPData = await loadJsonFile("RegenPOAP.json");
    console.log(`Found ${regenPOAPData.length} RegenPOAP entries in JSON`);

    // Insert RegenPOAP data into the database
    for (const poap of regenPOAPData) {
      const lowercaseCollection = poap.Collection.toLowerCase();
      try {
        await db
          .insert(schema.regenPOAPs)
          .values({
            nodeId: lowercaseCollection,
            collection: poap.Collection,
            count: poap.Count
          })
          .onConflictDoNothing();
        console.log(`Added/Verified RegenPOAP: ${lowercaseCollection}`);
      } catch (error) {
        console.error(`Error inserting RegenPOAP ${lowercaseCollection}:`, error);
      }
    }

    // Get all delegate nodes
    const delegateNodes = await db
      .select()
      .from(schema.nodes)
      .where(inArray(schema.nodes.nodeTypes, [["Delegate"]]));

    console.log(`Found ${delegateNodes.length} delegate nodes`);

    for (const delegate of delegateNodes) {
      const delegateId = delegate.id;
      console.log(`Processing delegate: ${delegateId}`);

      // Check TEC Holder status
      const tecHolder = await db
        .select()
        .from(schema.tecHolders)
        .where(eq(schema.tecHolders.id, delegateId))
        .limit(1);

      if (tecHolder.length > 0) {
        const linkExists = await checkLinkExists(
          delegateId,
          NodeType.TECHolder,
          "TECHolder"
        );
        if (!linkExists) {
          await db
            .insert(schema.links)
            .values({
              sourceId: delegateId,
              targetId: NodeType.TECHolder,
              type: "TECHolder"
            });
          console.log(`Added TEC Holder link for delegate: ${delegateId}`);
        } else {
          console.log(`TEC Holder link already exists for delegate: ${delegateId}`);
        }
      }

      // Check Regen Score
      const regenScore = await db
        .select()
        .from(schema.regenScores)
        .where(eq(schema.regenScores.address, delegateId))
        .limit(1);

      if (regenScore.length > 0) {
        const linkExists = await checkLinkExists(
          delegateId,
          NodeType.RegenScore,
          "RegenScore"
        );
        if (!linkExists) {
          await db
            .insert(schema.links)
            .values({
              sourceId: delegateId,
              targetId: NodeType.RegenScore,
              type: "RegenScore"
            });
          console.log(`Added RegenScore link for delegate: ${delegateId}`);
        } else {
          console.log(`RegenScore link already exists for delegate: ${delegateId}`);
        }
      }

      // Check Trusted Seed
      const trustedSeed = await db
        .select()
        .from(schema.trustedSeeds)
        .where(eq(schema.trustedSeeds.id, delegateId))
        .limit(1);

      if (trustedSeed.length > 0) {
        const linkExists = await checkLinkExists(
          delegateId,
          NodeType.TrustedSeed,
          "TrustedSeed"
        );
        if (!linkExists) {
          await db
            .insert(schema.links)
            .values({
              sourceId: delegateId,
              targetId: NodeType.TrustedSeed,
              type: "TrustedSeed"
            });
          console.log(`Added TrustedSeed link for delegate: ${delegateId}`);
        } else {
          console.log(`TrustedSeed link already exists for delegate: ${delegateId}`);
        }
      }

      // Check ReFi POAPs
      const refiPOAPs = await db
        .select()
        .from(schema.regenPOAPs)
        .where(eq(schema.regenPOAPs.nodeId, delegateId));

      if (refiPOAPs.length > 0) {
        const linkExists = await checkLinkExists(
          delegateId,
          NodeType.RegenPOAP,
          "RegenPOAP"
        );
        if (!linkExists) {
          await db
            .insert(schema.links)
            .values({
              sourceId: delegateId,
              targetId: NodeType.RegenPOAP,
              type: "RegenPOAP"
            });
          console.log(`Added RegenPOAP link for delegate: ${delegateId}`);
        } else {
          console.log(`RegenPOAP link already exists for delegate: ${delegateId}`);
        }
      }

      // Check BadgeHolder Referrals (as referrer)
      const badgeReferrals = await db
        .select()
        .from(schema.badgeHolders)
        .where(eq(schema.badgeHolders.referredBy, delegateId));

      for (const referral of badgeReferrals) {
        const linkExists = await checkLinkExists(
          delegateId,
          referral.recipient,
          "BadgeHolderReferral"
        );
        if (!linkExists) {
          await db
            .insert(schema.links)
            .values({
              sourceId: delegateId,
              targetId: referral.recipient,
              type: "BadgeHolderReferral"
            });
          console.log(
            `Added BadgeHolderReferral link from delegate ${delegateId} to ${referral.recipient}`
          );
        } else {
          console.log(
            `BadgeHolderReferral link already exists from delegate ${delegateId} to ${referral.recipient}`
          );
        }
      }
    }

    console.log("Finished linking delegate nodes");
  } catch (error) {
    console.error("Error during delegate node linking:", error);
  } finally {
    await sql.end();
  }
}

linkDelegateNodes().catch(console.error);

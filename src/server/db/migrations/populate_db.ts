import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import { ilike } from "drizzle-orm/expressions";

import * as schema from "../schema";
import * as fs from "fs/promises";
import * as path from "path";
import { NodeType } from "../../../app/graph/types";
import {
  removeDuplicateRegenScoreLinks,
  removeDuplicateTECHolderLinks
} from "../scripts/removeDuplicateLinks";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function loadJsonFile(filename: string) {
  const filePath = path.join(process.cwd(), "public", "data", filename);
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    throw error;
  }
}

async function migrateData() {
  try {
    console.log("Starting data migration...");
    await removeDuplicateTECHolderLinks();
    await removeDuplicateRegenScoreLinks();
    console.log("Attempting to insert Optimism network...");
    const result = await db
      .insert(schema.networks)
      .values({
        name: "Optimism",
        description: "Optimism mainnet",
        id: 10
      })
      .onConflictDoNothing();

    if (result.length > 0) {
      console.log("Optimism network inserted successfully.");
    } else {
      console.log("Optimism network was not inserted. It might already exist.");
    }

    // Load JSON data
    const dataFiles = [
      "CitizensWithoutFarcasterDataField.json",
      "TECHolders.json",
      "RegenScore.json",
      "TrustedSeed.json",
      "CitizensFarcasterConnections.json",
      "BadgeHolders.json",
      "RegenPOAP.json",
      "citizenTransactions.json"
    ];

    const loadedData = await Promise.all(dataFiles.map(loadJsonFile));
    const [
      citizensWithFarcaster,
      tecHoldersData,
      regenScoresData,
      trustedSeedData,
      farcasterConnectionsData,
      badgeHoldersData,
      regenPOAPData,
      citizenTransactionsData
    ] = loadedData;

    if (loadedData.some((data) => data === null)) {
      console.error(
        "Some data files are missing. Please ensure all required JSON files are present in the 'public/data' directory."
      );
      return;
    }

    // Insert special nodes
    const specialNodes = [
      { id: NodeType.TECHolder, type: NodeType.TECHolder },
      { id: NodeType.RegenScore, type: NodeType.RegenScore },
      { id: NodeType.TrustedSeed, type: NodeType.TrustedSeed },
      { id: NodeType.RegenPOAP, type: NodeType.RegenPOAP }
    ];

    for (const node of specialNodes) {
      await db
        .insert(schema.nodes)
        .values({
          id: node.id,
          networkId: 10,
          type: node.type,
          isSpecial: true
        })
        .onConflictDoUpdate({
          target: schema.nodes.id,
          set: { isSpecial: true }
        });
      console.log(`Inserted/updated special node: ${node.id}`);
    }

    // Insert nodes
    console.log("Inserting nodes...");
    for (const citizen of citizensWithFarcaster) {
      try {
        await db
          .insert(schema.nodes)
          .values({
            id: citizen.id?.toLowerCase() ?? "",
            networkId: 10,
            type: "Citizen",
            ens: citizen.ens,
            userId: citizen.userId,
            identity: citizen.identity?.toLowerCase() ?? "",
            profileImage: citizen.profileImage,
            profileName: citizen.profileName,
            profileDisplayName: citizen.profileDisplayName,
            profileBio: citizen.profileBio,
            userAddress: citizen.userAddress?.toLowerCase() ?? "",
            chainId: citizen.chainId,
            hasFarcaster: !!citizen.userId,
            isSpecial: false
          })
          .onConflictDoNothing();
      } catch (error) {
        console.error(`Error inserting node: ${citizen.id}`, error);
      }
    }
    console.log("Finished inserting nodes");

    // Insert TEC holders
    console.log("Inserting TEC holders...");
    for (const holder of tecHoldersData) {
      try {
        // Insert or update TEC holder
        await db
          .insert(schema.tecHolders)
          .values({
            id: holder.id?.toLowerCase() ?? "",
            balance: holder.balance,
            pendingBalanceUpdate: holder.pendingBalanceUpdate
          })
          .onConflictDoUpdate({
            target: schema.tecHolders.id,
            set: {
              balance: holder.balance,
              pendingBalanceUpdate: holder.pendingBalanceUpdate
            }
          });

        // Check if the holder ID exists in the nodes table
        const nodeExists = await db
          .select({ id: schema.nodes.id })
          .from(schema.nodes)
          .where(ilike(schema.nodes.id, holder.id ?? ""))
          .execute();

        if (nodeExists.length > 0) {
          // Check if the link already exists
          const existingLink = await db
            .select()
            .from(schema.links)
            .where(
              and(
                eq(schema.links.sourceId, holder.id?.toLowerCase() ?? ""),
                eq(schema.links.targetId, "TECHolder"),
                eq(schema.links.type, "TECHolder")
              )
            )
            .execute();

          // If the link doesn't exist, create it
          if (existingLink.length === 0) {
            await db
              .insert(schema.links)
              .values({
                sourceId: holder.id?.toLowerCase() ?? "",
                targetId: "TECHolder",
                type: "TECHolder"
              })
              .onConflictDoNothing();

            console.log(`Created new TEC Holder link for ${holder.id}`);
          } else {
            console.log(`TEC Holder link already exists for ${holder.id}`);
          }
        } else {
          console.log(`Node does not exist for TEC Holder ${holder.id}`);
        }
      } catch (error) {
        console.error(`Error processing TEC holder: ${holder.id}`, error);
      }
    }
    console.log("Finished inserting TEC holders");
    console.log("Inserted TEC holders");

    // Insert Regen Scores
    console.log("Inserting Regen Scores...");
    for (const score of regenScoresData) {
      try {
        // Insert into regen_scores table
        await db
          .insert(schema.regenScores)
          .values({
            id: score.id.toLowerCase(),
            score: score.score,
            address: score.address.toLowerCase(),
            meta: score.meta
          })
          .onConflictDoUpdate({
            target: schema.regenScores.id,
            set: {
              score: score.score,
              address: score.address.toLowerCase(),
              meta: score.meta
            }
          });

        // Check if there's a corresponding node
        const matchingNode = await db
          .select()
          .from(schema.nodes)
          .where(eq(schema.nodes.id, score.address.toLowerCase()))
          .limit(1);

        if (matchingNode.length > 0) {
          // Check if the link already exists
          const existingLink = await db
            .select()
            .from(schema.links)
            .where(
              and(
                eq(schema.links.sourceId, score.address.toLowerCase()),
                eq(schema.links.targetId, "RegenScore"),
                eq(schema.links.type, "RegenScore")
              )
            )
            .limit(1);

          // If the link doesn't exist, create it
          if (existingLink.length === 0) {
            await db
              .insert(schema.links)
              .values({
                sourceId: score.address.toLowerCase(),
                targetId: "RegenScore",
                type: "RegenScore"
              })
              .onConflictDoNothing();
            console.log(
              `Created RegenScore link for address: ${score.address}`
            );
          } else {
            console.log(
              `RegenScore link already exists for address: ${score.address}`
            );
          }
        } else {
          console.log(
            `No matching node found for RegenScore address: ${score.address}`
          );
        }
      } catch (error) {
        console.error(`Error processing RegenScore: ${score.id}`, error);
      }
    }
    console.log("Finished inserting Regen Scores");

    // Insert Trusted Seeds
    console.log("Inserting Trusted Seeds...");
    for (const seed of trustedSeedData) {
      try {
        // Check if there's a corresponding node
        const matchingNode = await db
          .select()
          .from(schema.nodes)
          .where(eq(schema.nodes.id, seed.id.toLowerCase()))
          .limit(1);

        if (matchingNode.length > 0) {
          // Insert into trusted_seeds table
          await db
            .insert(schema.trustedSeeds)
            .values({
              id: seed.id.toLowerCase()
            })
            .onConflictDoNothing();

          // Check if the link already exists
          const existingLink = await db
            .select()
            .from(schema.links)
            .where(
              and(
                eq(schema.links.sourceId, seed.id.toLowerCase()),
                eq(schema.links.targetId, "TrustedSeed"),
                eq(schema.links.type, "TrustedSeed")
              )
            )
            .limit(1);

          // If the link doesn't exist, create it
          if (existingLink.length === 0) {
            await db
              .insert(schema.links)
              .values({
                sourceId: seed.id.toLowerCase(),
                targetId: "TrustedSeed",
                type: "TrustedSeed"
              })
              .onConflictDoNothing();
            console.log(`Created TrustedSeed link for: ${seed.id}`);
          } else {
            console.log(`TrustedSeed link already exists for: ${seed.id}`);
          }
        } else {
          console.log(`No matching node found for TrustedSeed: ${seed.id}`);
        }
      } catch (error) {
        console.error(`Error processing TrustedSeed: ${seed.id}`, error);
      }
    }
    console.log("Finished inserting Trusted Seeds");

    // Insert Farcaster Connections
    for (const connection of farcasterConnectionsData) {
      await db.insert(schema.farcasterConnections).values({
        sourceId: connection.source.toLowerCase(),
        targetId: connection.target.toLowerCase()
      });
      await db.insert(schema.links).values({
        sourceId: connection.source.toLowerCase(),
        targetId: connection.target.toLowerCase(),
        type: "FarcasterConnection"
      });
    }

    // Insert Badge Holders
    for (const badge of badgeHoldersData) {
      await db.insert(schema.badgeHolders).values({
        attester: badge.attester.toLowerCase(),
        recipient: badge.recipient.toLowerCase(),
        rpgfRound: badge.rpgfRound,
        referredBy: badge.referredBy.toLowerCase(),
        referredMethod: badge.referredMethod
      });
      if (badge.referredBy !== "0x0000000000000000000000000000000000000000") {
        await db.insert(schema.links).values({
          sourceId: badge.referredBy.toLowerCase(),
          targetId: badge.recipient.toLowerCase(),
          type: "BadgeHolderReferral"
        });
      }
    }

    // Insert Regen POAPs
    for (const poap of regenPOAPData) {
      await db.insert(schema.regenPOAPs).values({
        nodeId: poap.Collection.toLowerCase(),
        collection: poap.Collection,
        count: poap.Count
      });
      await db.insert(schema.links).values({
        sourceId: poap.Collection.toLowerCase(),
        targetId: "RegenPOAP",
        type: "RegenPOAP"
      });
    }

    // Insert Citizen Transactions
    for (const transaction of citizenTransactionsData) {
      await db.insert(schema.transactions).values({
        networkId: 10, // Assuming Optimism network has id 1
        date: new Date(transaction.date),
        fromId: transaction.from.toLowerCase(),
        toId: transaction.to.toLowerCase(),
        tokenName: transaction.tokenName,
        tokenSymbol: transaction.tokenSymbol,
        value: transaction.value.toString(),
        hash: transaction.hash
      });
      await db.insert(schema.links).values({
        sourceId: transaction.from.toLowerCase(),
        targetId: transaction.to.toLowerCase(),
        type: "CitizenTransaction"
      });
    }

    console.log("Data migration completed successfully.");
  } catch (error) {
    console.error("Error during data migration:", error);
  } finally {
    await sql.end();
  }
}

migrateData().catch(console.error);

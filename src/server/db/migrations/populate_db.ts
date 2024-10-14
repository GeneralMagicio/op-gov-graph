import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";
import * as fs from "fs/promises";
import * as path from "path";

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

    // Insert the Optimism network first
    db.insert(schema.networks)
      .values({
        name: "Optimism",
        description: "Optimism mainnet",
        id: 10 // Change from 10 to 1
      })
      .onConflictDoNothing();

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

    // Insert nodes
    for (const citizen of citizensWithFarcaster) {
      await db.insert(schema.nodes).values({
        id: citizen.id,
        networkId: 10, // Now this should work as we've inserted the network
        type: "Citizen",
        ens: citizen.ens,
        userId: citizen.userId,
        identity: citizen.identity,
        profileImage: citizen.profileImage,
        profileName: citizen.profileName,
        profileDisplayName: citizen.profileDisplayName,
        profileBio: citizen.profileBio,
        userAddress: citizen.userAddress,
        chainId: citizen.chainId,
        hasFarcaster: !!citizen.userId
      });
    }

    // Insert TEC holders
    for (const holder of tecHoldersData) {
      await db.insert(schema.tecHolders).values({
        id: holder.id,
        balance: holder.balance,
        pendingBalanceUpdate: holder.pendingBalanceUpdate
      });
      await db.insert(schema.links).values({
        sourceId: holder.id,
        targetId: "TECHolder",
        type: "TECHolder"
      });
    }

    // Insert Regen Scores
    for (const score of regenScoresData) {
      await db.insert(schema.regenScores).values({
        id: score.id,
        score: score.score,
        address: score.address,
        meta: score.meta
      });
      await db.insert(schema.links).values({
        sourceId: score.id,
        targetId: "RegenScore",
        type: "RegenScore"
      });
    }

    // Insert Trusted Seeds
    for (const seed of trustedSeedData) {
      await db.insert(schema.trustedSeeds).values({
        id: seed.id
      });
      await db.insert(schema.links).values({
        sourceId: seed.id,
        targetId: "TrustedSeed",
        type: "TrustedSeed"
      });
    }

    // Insert Farcaster Connections
    for (const connection of farcasterConnectionsData) {
      await db.insert(schema.farcasterConnections).values({
        sourceId: connection.source,
        targetId: connection.target
      });
      await db.insert(schema.links).values({
        sourceId: connection.source,
        targetId: connection.target,
        type: "FarcasterConnection"
      });
    }

    // Insert Badge Holders
    for (const badge of badgeHoldersData) {
      await db.insert(schema.badgeHolders).values({
        attester: badge.attester,
        recipient: badge.recipient,
        rpgfRound: badge.rpgfRound,
        referredBy: badge.referredBy,
        referredMethod: badge.referredMethod
      });
      if (badge.referredBy !== "0x0000000000000000000000000000000000000000") {
        await db.insert(schema.links).values({
          sourceId: badge.referredBy,
          targetId: badge.recipient,
          type: "BadgeHolderReferral"
        });
      }
    }

    // Insert Regen POAPs
    for (const poap of regenPOAPData) {
      await db.insert(schema.regenPOAPs).values({
        nodeId: poap.Collection,
        collection: poap.Collection,
        count: poap.Count
      });
      await db.insert(schema.links).values({
        sourceId: poap.Collection,
        targetId: "RegenPOAP",
        type: "RegenPOAP"
      });
    }

    // Insert Citizen Transactions
    for (const transaction of citizenTransactionsData) {
      await db.insert(schema.transactions).values({
        networkId: 1, // Assuming Optimism network has id 1
        date: new Date(transaction.date),
        fromId: transaction.from,
        toId: transaction.to,
        tokenName: transaction.tokenName,
        tokenSymbol: transaction.tokenSymbol,
        value: transaction.value.toString(),
        hash: transaction.hash
      });
      await db.insert(schema.links).values({
        sourceId: transaction.from,
        targetId: transaction.to,
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

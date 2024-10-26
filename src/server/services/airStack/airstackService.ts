// src/server/services/airStack/airstackService.ts
import { init, fetchQuery } from "@airstack/node";
import { nodes } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { z } from "zod";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables first
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../"); // Go up to project root

// Load .env file
config({ path: path.resolve(projectRoot, ".env") });

// Create a runtime environment validator
const runtimeEnv = z.object({
  DATABASE_URL: z.string().min(1),
  AIRSTACK_API_KEY: z.string().min(1)
});

// Validate environment
const validateEnv = () => {
  try {
    const env = runtimeEnv.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      AIRSTACK_API_KEY: process.env.AIRSTACK_API_KEY
    });
    return env;
  } catch (error) {
    console.error("Environment validation failed:");
    console.error("Current environment variables:", {
      DATABASE_URL: process.env.DATABASE_URL ? "[EXISTS]" : "[MISSING]",
      AIRSTACK_API_KEY: process.env.AIRSTACK_API_KEY ? "[EXISTS]" : "[MISSING]"
    });
    throw error;
  }
};

interface AirstackSocialResponse {
  data: {
    Socials: {
      Social: {
        id: string;
        chainId: string;
        blockchain: string;
        dappName: string;
        dappSlug: string;
        dappVersion: string;
        userId: string;
        userAddress: string;
        userAssociatedAddresses: string[];
        profileBio: string;
        profileDisplayName: string;
        profileImage: string;
        profileUrl: string;
        profileName: string;
        identity: string;
      }[];
    };
  };
  error?: {
    message: string;
  };
}

export class AirstackService {
  private db: PostgresJsDatabase;
  private static instance: AirstackService;
  private env: z.infer<typeof runtimeEnv>;

  private constructor(db: PostgresJsDatabase) {
    this.db = db;
    // Validate environment variables and store them
    this.env = validateEnv();
    // Initialize Airstack with API key
    init(this.env.AIRSTACK_API_KEY);
  }

  // Singleton pattern to ensure we only have one instance
  static getInstance(db: PostgresJsDatabase): AirstackService {
    if (!AirstackService.instance) {
      AirstackService.instance = new AirstackService(db);
    }
    return AirstackService.instance;
  }

  private async getFarcasterData(address: string) {
    const query = `
      query GetFarcasterData {
        Socials(
          input: {
            filter: {
              dappName: {_eq: farcaster}, 
              identity: {_eq: "${address}"}
            }, 
            blockchain: ethereum
          }
        ) {
          Social {
            id
            chainId
            blockchain
            dappName
            dappSlug
            dappVersion
            userId
            userAddress
            userAssociatedAddresses
            profileBio
            profileDisplayName
            profileImage
            profileUrl
            profileName
            identity
          }
        }
      }
    `;

    try {
      const response: AirstackSocialResponse = await fetchQuery(query);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.Socials.Social[0];
    } catch (error) {
      console.error(
        `Error fetching Farcaster data for address ${address}:`,
        error
      );
      return null;
    }
  }

  async updateSingleCitizen(address: string) {
    const farcasterData = await this.getFarcasterData(address);

    if (!farcasterData) {
      console.log(`No Farcaster data found for address ${address}`);
      return;
    }

    try {
      await this.db
        .update(nodes)
        .set({
          userId: farcasterData.userId,
          userAddress: farcasterData.userAddress?.toLowerCase(),
          chainId: farcasterData.chainId,
          profileBio: farcasterData.profileBio,
          profileImage: farcasterData.profileImage,
          profileName: farcasterData.profileName,
          profileDisplayName: farcasterData.profileDisplayName,
          hasFarcaster: true,
          updatedAt: new Date()
        })
        .where(eq(nodes.id, address.toLowerCase()));

      console.log(`Updated Farcaster data for ${address}`);
    } catch (error) {
      console.error(`Error updating Farcaster data for ${address}:`, error);
    }
  }

  async updateAllCitizens() {
    try {
      // Get all citizen nodes
      const citizens = await this.db
        .select({
          id: nodes.id
        })
        .from(nodes)
        .where(eq(nodes.type, "Citizen"));

      console.log(`Found ${citizens.length} citizens to update`);

      // Process in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < citizens.length; i += batchSize) {
        const batch = citizens.slice(i, i + batchSize);

        // Process batch concurrently
        await Promise.all(
          batch.map((citizen) => this.updateSingleCitizen(citizen.id))
        );

        // Add delay between batches to respect rate limits
        if (i + batchSize < citizens.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log("Completed updating Farcaster data for all citizens");
    } catch (error) {
      console.error("Error updating all citizens:", error);
      throw error;
    }
  }
}

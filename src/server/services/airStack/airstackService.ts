// src/server/services/airStack/airstackService.ts
import { init, fetchQuery } from "@airstack/node";
import { nodes, farcasterConnections, links } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
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

interface AirstackFollowingResponse {
  data: {
    SocialFollowings: {
      Following: {
        id: string;
        blockchain: string;
        followingProfileId: string;
      }[];
      pageInfo: {
        hasNextPage: boolean;
        nextCursor: string;
        prevCursor: string;
        hasPrevPage: boolean;
      };
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

  private async getFarcasterFollowings(profileTokenId: string, cursor = "") {
    const query = `
      query SocialFollowingsDetails {
        SocialFollowings(
          input: {
            filter: {
              dappName: {_eq: farcaster}, 
              followerProfileId: {_eq: "${profileTokenId}"}
            },
            blockchain: ALL,
            limit: 200,
            cursor: "${cursor}"
          }
        ) {
          Following {
            id
            blockchain
            followingProfileId
          }
          pageInfo {
            hasNextPage
            nextCursor
            prevCursor
            hasPrevPage
          }
        }
      }
    `;

    try {
      const response: AirstackFollowingResponse = await fetchQuery(query);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.SocialFollowings;
    } catch (error) {
      console.error(
        `Error fetching Farcaster followings for profile ${profileTokenId}:`,
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

  async updateFarcasterFollowings(address: string) {
    const farcasterData = await this.getFarcasterData(address);

    if (!farcasterData?.userId) {
      console.log(`No Farcaster userId found for address ${address}`);
      return;
    }

    try {
      const citizens = await this.db
        .select({
          id: nodes.id,
          userId: nodes.userId
        })
        .from(nodes)
        .where(eq(nodes.type, "Citizen"));

      const citizenMap = new Map(
        citizens
          .filter((c) => c.userId)
          .map((c) => [c.userId, c.id.toLowerCase()])
      );

      let hasNextPage = true;
      let cursor = "";
      let totalProcessed = 0;

      while (hasNextPage) {
        const followingsData = await this.getFarcasterFollowings(
          farcasterData.userId,
          cursor
        );

        if (!followingsData) {
          console.log(
            `No followings data returned for userId ${farcasterData.userId}`
          );
          break;
        }

        const { Following, pageInfo } = followingsData;

        for (const following of Following) {
          try {
            const targetCitizenAddress = citizenMap.get(
              following.followingProfileId
            );

            if (!targetCitizenAddress) {
              continue;
            }

            const sourceAddress = address.toLowerCase();

            // Check if farcaster connection already exists
            const existingFarcasterConnection = await this.db
              .select()
              .from(farcasterConnections)
              .where(
                and(
                  eq(farcasterConnections.sourceId, sourceAddress),
                  eq(farcasterConnections.targetId, targetCitizenAddress)
                )
              )
              .limit(1);

            // Check if link already exists
            const existingLink = await this.db
              .select()
              .from(links)
              .where(
                and(
                  eq(links.sourceId, sourceAddress),
                  eq(links.targetId, targetCitizenAddress),
                  eq(links.type, "FarcasterConnection")
                )
              )
              .limit(1);

            // Only insert if connections don't exist
            if (existingFarcasterConnection.length === 0) {
              await this.db.insert(farcasterConnections).values({
                sourceId: sourceAddress,
                targetId: targetCitizenAddress
              });
              console.log(
                `Created Farcaster connection: ${sourceAddress} -> ${targetCitizenAddress}`
              );
            }

            if (existingLink.length === 0) {
              await this.db.insert(links).values({
                sourceId: sourceAddress,
                targetId: targetCitizenAddress,
                type: "FarcasterConnection"
              });
              console.log(
                `Created Link: ${sourceAddress} -> ${targetCitizenAddress}`
              );
            }
          } catch (error) {
            console.error(
              `Error processing following relationship for ${following.followingProfileId}:`,
              error
            );
          }
        }

        totalProcessed += Following.length;
        console.log(
          `Processed ${totalProcessed} followings for ${farcasterData.userId}`
        );

        hasNextPage = pageInfo.hasNextPage;
        cursor = pageInfo.nextCursor;

        if (hasNextPage) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log(
        `Completed updating Farcaster followings for ${farcasterData.userId}`
      );
    } catch (error) {
      console.error(
        `Error updating Farcaster followings for ${address}:`,
        error
      );
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

  async updateAllFarcasterFollowings() {
    try {
      // Get all citizens with Farcaster profiles
      const farcasterCitizens = await this.db
        .select({
          id: nodes.id
        })
        .from(nodes)
        .where(and(eq(nodes.type, "Citizen"), eq(nodes.hasFarcaster, true)));

      console.log(
        `Found ${farcasterCitizens.length} citizens with Farcaster to update`
      );

      // Process in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < farcasterCitizens.length; i += batchSize) {
        const batch = farcasterCitizens.slice(i, i + batchSize);

        // Process batch concurrently
        await Promise.all(
          batch.map((citizen) => this.updateFarcasterFollowings(citizen.id))
        );

        // Add delay between batches
        if (i + batchSize < farcasterCitizens.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      console.log("Completed updating Farcaster followings for all citizens");
    } catch (error) {
      console.error("Error updating all Farcaster followings:", error);
      throw error;
    }
  }
}

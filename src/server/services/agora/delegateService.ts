// src/server/services/delegateService.ts
import { ApiResponse, DelegateDataAgora } from "@/app/graph/types/delegates";
import { nodes } from "@/server/db/schema";
import { db } from "@/server/db";
import axios from "axios";
import { eq } from "drizzle-orm";

export class DelegateService {
  private static readonly API_URL = "https://vote.optimism.io/api/v1";
  private static readonly BATCH_SIZE = 50;
  private static readonly MAX_DELEGATES = 1000;
  private readonly apiKey: string;

  constructor() {
    if (!process.env.AGORA_API_KEY) {
      throw new Error("AGORA_API_KEY environment variable is not set");
    }
    this.apiKey = process.env.AGORA_API_KEY;
  }

  async fetchAllDelegates(): Promise<DelegateDataAgora[]> {
    let allDelegates: DelegateDataAgora[] = [];
    let hasMore = true;
    let offset = 0;

    while (hasMore && allDelegates.length < DelegateService.MAX_DELEGATES) {
      try {
        const remainingCount =
          DelegateService.MAX_DELEGATES - allDelegates.length;
        const currentBatchSize = Math.min(
          DelegateService.BATCH_SIZE,
          remainingCount
        );

        const response = await axios.get<ApiResponse>(
          `${DelegateService.API_URL}/delegates`,
          {
            params: {
              offset,
              limit: currentBatchSize,
              // Sort by voting power in descending order
              sort: "voting_power",
              direction: "desc"
            },
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              Accept: "application/json"
            }
          }
        );

        allDelegates = [...allDelegates, ...response.data.data];

        // Stop if we've reached our target or there's no more data
        if (
          allDelegates.length >= DelegateService.MAX_DELEGATES ||
          !response.data.meta.has_next
        ) {
          hasMore = false;
        } else {
          offset = response.data.meta.next_offset;
        }

        console.log(
          `Fetched ${response.data.data.length} delegates. Total so far: ${allDelegates.length}/${DelegateService.MAX_DELEGATES}`
        );

        // Add delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(
            `API Error: ${error.response?.status} - ${error.response?.statusText}`
          );
          console.error("Error details:", error.response?.data);
        }
        console.error(`Error fetching delegates at offset ${offset}:`, error);
        throw error;
      }
    }

    // Ensure we don't exceed MAX_DELEGATES
    return allDelegates.slice(0, DelegateService.MAX_DELEGATES);
  }

  async upsertDelegate(delegateData: DelegateDataAgora) {
    const address = delegateData.address.toLowerCase();

    try {
      // Check if node exists using select instead of query builder
      const existingNode = await db
        .select()
        .from(nodes)
        .where(eq(nodes.id, address))
        .then((rows) => rows[0]);

      // Properly handle nodeTypes
      let nodeTypes = ["Delegate"];

      if (existingNode) {
        // If node exists, preserve existing types and ensure both Citizen and Delegate are present if needed
        nodeTypes = [
          ...new Set([
            ...existingNode.nodeTypes,
            "Delegate",
            ...(delegateData.citizen ||
            existingNode.nodeTypes.includes("Citizen")
              ? ["Citizen"]
              : [])
          ])
        ];
      } else if (delegateData.citizen) {
        // For new nodes, add Citizen if the delegate data indicates it
        nodeTypes = ["Citizen", "Delegate"];
      }

      const statementData = delegateData.statement?.payload;

      const nodeData = {
        nodeTypes,
        isDelegate: true,
        votingPower: delegateData.votingPower,
        delegateStatement: delegateData.statement
          ? JSON.stringify(delegateData.statement)
          : null,
        // Map statement fields to corresponding DB fields
        twitterUrl: delegateData.statement?.twitter || null,
        farcasterUrl: delegateData.statement?.warpcast || null,
        discordUrl: delegateData.statement?.discord || null,
        roles: statementData?.topIssues?.map((i) => i.type).join(", ") || null,
        description: statementData?.delegateStatement || null,
        endorsed: delegateData.statement?.endorsed ?? false,
        topIssues: statementData?.topIssues || null,
        // JSON data for additional fields
        data: {
          openToSponsoringProposals:
            statementData?.openToSponsoringProposals || null,
          mostValuableProposals: statementData?.mostValuableProposals || null,
          leastValuableProposals: statementData?.leastValuableProposals || null,
          topStakeholders: statementData?.topStakeholders || null,
          agreeCodeConduct: statementData?.agreeCodeConduct || null,
          for: statementData?.for || null
        },
        updatedAt: new Date()
      };

      if (existingNode) {
        // Update existing node
        await db
          .update(nodes)
          .set({
            ...nodeData,
            nodeTypes: nodeTypes,
            twitterUrl: existingNode.twitterUrl || nodeData.twitterUrl,
            farcasterUrl: existingNode.farcasterUrl || nodeData.farcasterUrl,
            discordUrl: existingNode.discordUrl || nodeData.discordUrl,
            roles: existingNode.roles || nodeData.roles,
            description: existingNode.description || nodeData.description,
            data: {
              ...((existingNode.data as object) || {}),
              ...(nodeData.data || {})
            }
          })
          .where(eq(nodes.id, address));

        console.log(
          `Updated delegate: ${address} with nodeTypes: ${nodeTypes.join(", ")}`
        );
      } else {
        // Insert new node
        await db.insert(nodes).values({
          id: address,
          networkId: 10, // Optimism network
          ...nodeData
        });

        console.log(
          `Inserted new delegate: ${address} with nodeTypes: ${nodeTypes.join(", ")}`
        );
      }
    } catch (error) {
      console.error(`Error upserting delegate ${address}:`, error);
      throw error;
    }
  }
}

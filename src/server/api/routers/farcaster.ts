import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { eq, inArray } from "drizzle-orm";
import { nodes, farcasterConnections } from "@/server/db/schema";

export const farcasterRouter = createTRPCRouter({
  getAllData: publicProcedure.query(async ({ ctx }) => {
    const farcasterNodes = await ctx.db
      .select({
        id: nodes.id,
        userId: nodes.userId,
        profileImage: nodes.profileImage,
        profileName: nodes.profileName,
        profileDisplayName: nodes.profileDisplayName
      })
      .from(nodes)
      .where(eq(nodes.hasFarcaster, true));

    const processedData: { [userId: string]: any } = {};
    farcasterNodes.forEach((node) => {
      if (node.userId) {
        processedData[node.userId] = {
          id: node.id,
          profileImage: node.profileImage,
          profileName: node.profileName,
          profileDisplayName: node.profileDisplayName
        };
      }
    });

    return processedData;
  }),

  getAddressToUserIdMap: publicProcedure.query(async ({ ctx }) => {
    const farcasterNodes = await ctx.db
      .select({
        id: nodes.id,
        userId: nodes.userId
      })
      .from(nodes)
      .where(eq(nodes.hasFarcaster, true));

    const addressMap: { [address: string]: string } = {};
    farcasterNodes.forEach((node) => {
      if (node.userId) {
        addressMap[node.id.toLowerCase()] = node.userId;
      }
    });

    return addressMap;
  }),

  getConnectionsForNode: publicProcedure
    .input(z.object({ nodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const connections = await ctx.db
        .select({
          targetId: farcasterConnections.targetId
        })
        .from(farcasterConnections)
        .where(eq(farcasterConnections.sourceId, input.nodeId))
        .groupBy(farcasterConnections.targetId);

      return connections.map((connection) => connection.targetId);
    }),

  getDataForConnections: publicProcedure
    .input(z.object({ connectionIds: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      const connectionData = await ctx.db
        .select({
          id: nodes.id,
          userId: nodes.userId,
          profileImage: nodes.profileImage,
          profileName: nodes.profileName,
          profileDisplayName: nodes.profileDisplayName
        })
        .from(nodes)
        .where(inArray(nodes.id, input.connectionIds));

      return connectionData;
    }),

  getDataByAddress: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ ctx, input }) => {
      const nodeData = await ctx.db
        .select({
          id: nodes.id,
          userId: nodes.userId,
          profileImage: nodes.profileImage,
          profileName: nodes.profileName,
          profileDisplayName: nodes.profileDisplayName
        })
        .from(nodes)
        .where(eq(nodes.id, input.address.toLowerCase()))
        .limit(1);

      return nodeData[0];
    })
});

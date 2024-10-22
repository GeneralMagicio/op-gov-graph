import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { nodes, links } from "@/server/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { NodeLinkType, NodeType } from "@/app/graph/types";

export const graphRouter = createTRPCRouter({
  getGraphData: publicProcedure
    .input(
      z.object({
        networkId: z.number(),
        selectedNodeTypes: z.array(z.string()),
        selectedLinkTypes: z.array(z.string())
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { networkId, selectedNodeTypes, selectedLinkTypes } = input;

      const nodesData = await db
        .select()
        .from(nodes)
        .where(
          and(
            eq(nodes.networkId, networkId),
            or(
              inArray(
                nodes.type,
                selectedNodeTypes as (typeof NodeType.Citizen)[]
              ),
              eq(nodes.isSpecial, true)
            )
          )
        );

      const linksData = await db
        .select()
        .from(links)
        .where(
          and(
            inArray(
              links.sourceId,
              nodesData.map((node) => node.id)
            ),
            inArray(
              links.targetId,
              nodesData.map((node) => node.id)
            ),
            inArray(
              links.type,
              selectedLinkTypes as (typeof NodeLinkType.FarcasterConnection)[]
            )
          )
        );

      return {
        nodes: nodesData,
        links: linksData
      };
    }),

  addNode: publicProcedure
    .input(
      z.object({
        networkId: z.number(),
        type: z.string()
        // Add other node properties here
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { networkId, type } = input;
      const id = crypto.randomUUID(); // Generate a unique ID for the node
      const newNode = await db
        .insert(nodes)
        .values({
          id,
          networkId,
          type: type as (typeof nodes.type.enumValues)[number],
          // Add other default values for required fields here
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newNode[0];
    }),

  updateNode: publicProcedure
    .input(
      z.object({
        id: z.string()
        // Add other updatable properties here
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { id, ...updateData } = input;
      const updatedNode = await db
        .update(nodes)
        .set(updateData)
        .where(eq(nodes.id, id))
        .returning();
      return updatedNode[0];
    }),

  deleteNode: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      await db.delete(nodes).where(eq(nodes.id, input.id));
      return { success: true };
    }),

  addLink: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        targetId: z.string(),
        type: z.string()
        // Add other link properties here
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const newLink = await db
        .insert(links)
        .values({
          ...input,
          type: input.type as (typeof links.type.enumValues)[number]
        })
        .returning();
      return newLink[0];
    }),

  deleteLink: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      await db.delete(links).where(eq(links.id, input.id));
      return { success: true };
    })
});

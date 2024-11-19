import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { nodes, links } from "@/server/db/schema";
import { eq, and, inArray, or, arrayContains, sql } from "drizzle-orm";
import { NodeLinkType, NodeType } from "@/app/graph/types";

const nodeTypeEnum = z.enum([NodeType.Citizen, NodeType.Delegate]);

export const graphRouter = createTRPCRouter({
  getGraphData: publicProcedure
    .input(
      z.object({
        networkId: z.number(),
        selectedNodeTypes: z.array(nodeTypeEnum),
        selectedLinkTypes: z.array(z.string())
      })
    )
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { networkId, selectedNodeTypes, selectedLinkTypes } = input;

      const nodeTypesArray = `{${selectedNodeTypes.map((type) => `"${type}"`).join(",")}}`;

      const nodesData = await db
        .select()
        .from(nodes)
        .where(
          and(
            eq(nodes.networkId, networkId),
            or(
              sql`${nodes.nodeTypes} && ${sql`${nodeTypesArray}::text[]`}`,
              eq(nodes.isSpecial, true)
            )
          )
        );

      const nodeIds = nodesData.map((node) => node.id);

      const linksData = await db
        .select()
        .from(links)
        .where(
          and(
            inArray(links.sourceId, nodeIds),
            inArray(links.targetId, nodeIds),
            inArray(links.type, selectedLinkTypes as any[])
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
        nodeTypes: z.array(z.string())
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { networkId, nodeTypes } = input;
      const id = crypto.randomUUID();
      const newNode = await db
        .insert(nodes)
        .values({
          id,
          networkId,
          nodeTypes,
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

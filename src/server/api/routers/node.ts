import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { nodes } from "@/server/db/schema";

export const nodeRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const node = await ctx.db
        .select()
        .from(nodes)
        .where(eq(nodes.id, input.id))
        .limit(1);
      return node[0] || null;
    })
});

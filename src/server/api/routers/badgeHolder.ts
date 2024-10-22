import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { badgeHolders } from "@/server/db/schema";

export const badgeHolderRouter = createTRPCRouter({
  getReferralsForNode: publicProcedure
    .input(z.object({ nodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const referredBy = await ctx.db
        .select()
        .from(badgeHolders)
        .where(eq(badgeHolders.recipient, input.nodeId));
      const referred = await ctx.db
        .select()
        .from(badgeHolders)
        .where(eq(badgeHolders.referredBy, input.nodeId));

      return {
        referredBy,
        referred
      };
    })
});

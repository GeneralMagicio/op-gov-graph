import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  getPOAPs,
  getMultisigWallets
} from "@/server/services/sybil/sybilScoringService";
import { vouches } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

export const sybilScoringRouter = createTRPCRouter({
  calculateSybilScore: publicProcedure
    .input(z.object({ walletAddress: z.string().toLowerCase() }))
    .query(async ({ ctx, input }) => {
      const vouchCount = (await ctx.db
        .select({ count: sql`COUNT(*)` })
        .from(vouches)
        .where(eq(vouches.vouchedAddress, input.walletAddress))) as {
        count: number;
      }[];

      console.log("vouchCountObj = ", vouchCount);

      const poaps = await getPOAPs(input.walletAddress);
      const multisigWallets = await getMultisigWallets(input.walletAddress);

      const sybilScore =
        poaps.length + multisigWallets.length + Number(vouchCount[0].count);
      return sybilScore;
    })
});

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  getPOAPs,
  getMultisigWallets
} from "@/server/services/sybil/sybilScoringService";
import { vouches } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { isAddressENS, getAddressFromENS } from "@/app/utils/wallet";

export const sybilScoringRouter = createTRPCRouter({
  calculateSybilScore: publicProcedure
    .input(z.object({ walletAddress: z.string().toLowerCase() }))
    .query(async ({ ctx, input }) => {
      let walletAddress = input.walletAddress;

      if (isAddressENS(input.walletAddress)) {
        const address = await getAddressFromENS(input.walletAddress);

        if (!address) {
          throw new Error("Invalid ENS name");
        } else {
          walletAddress = address.toLowerCase();
        }
      }

      const vouchCount = (await ctx.db
        .select({ count: sql`COUNT(*)` })
        .from(vouches)
        .where(eq(vouches.vouchedAddress, walletAddress))) as {
        count: number;
      }[];

      console.log("vouchCountObj = ", vouchCount);

      const poaps = await getPOAPs(walletAddress);
      const multisigWallets = await getMultisigWallets(walletAddress);

      const sybilScore =
        poaps.length + multisigWallets.length + Number(vouchCount[0].count);
      return sybilScore;
    })
});

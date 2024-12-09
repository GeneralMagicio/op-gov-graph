import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { vouches } from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { isAddress } from 'viem';

export const vouchingRouter = createTRPCRouter({
  vouch: publicProcedure
    .input(
      z.object({
        vouchingAddress: z.string().toLowerCase(),
        walletAddress: z.string().toLowerCase()
      })
    )
    .mutation(async ({ ctx, input }) => {

      if (!isAddress(input.walletAddress)) {
        throw new Error("The passed address is not a valid Ethereum address.");
      }

      if (!isAddress(input.vouchingAddress)) {
        throw new Error("Your connected wallet address is not a valid Ethereum address.");
      }

      if (input.vouchingAddress === input.walletAddress) {
        throw new Error("You cannot vouch for yourself.");
      }

      const existingVouch = await ctx.db
        .select()
        .from(vouches)
        .where(
          and(
            eq(vouches.vouchingAddress, input.vouchingAddress),
            eq(vouches.vouchedAddress, input.walletAddress)
          )
        );

      if (existingVouch.length > 0) {
        throw new Error("You have already vouched for this address.");
      }

      await ctx.db.insert(vouches).values({
        vouchingAddress: input.vouchingAddress,
        vouchedAddress: input.walletAddress
      });
    }),
  getVouchesCount: publicProcedure
    .input(z.object({ walletAddress: z.string().toLowerCase() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.db
        .select({ count: sql`COUNT(*)` })
        .from(vouches)
        .where(eq(vouches.vouchingAddress, input.walletAddress));
      return count[0].count as number;
    }),
  getVouchedCount: publicProcedure
    .input(z.object({ walletAddress: z.string().toLowerCase() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.db
        .select({ count: sql`COUNT(*)` })
        .from(vouches)
        .where(eq(vouches.vouchedAddress, input.walletAddress));
      return count[0].count as number;
    })
});

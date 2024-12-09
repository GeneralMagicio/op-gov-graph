import { createCallerFactory, createTRPCRouter } from "./trpc";
import { graphRouter } from "./routers/graph";
import { farcasterRouter } from "./routers/farcaster";
import { badgeHolderRouter } from "./routers/badgeHolder";
import { nodeRouter } from "./routers/node";
import { sybilScoringRouter } from "./routers/sybilScoring";
import { vouchingRouter } from "./routers/vouch";

export const appRouter = createTRPCRouter({
  node: nodeRouter,
  badgeHolder: badgeHolderRouter,
  graph: graphRouter,
  farcaster: farcasterRouter,
  sybilScoring: sybilScoringRouter,
  vouching: vouchingRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

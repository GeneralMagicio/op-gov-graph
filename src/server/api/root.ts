import { createCallerFactory, createTRPCRouter } from "./trpc";
import { graphRouter } from "./routers/graph";

export const appRouter = createTRPCRouter({
  graph: graphRouter
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

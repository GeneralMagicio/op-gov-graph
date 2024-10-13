import { createTRPCRouter } from "./trpc";
import { graphRouter } from "./routers/graph";

export const appRouter = createTRPCRouter({
  graph: graphRouter,
});

export type AppRouter = typeof appRouter;
// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { nodeRouter } from "./nodes";
import { graphsRouter } from "./graphs";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("nodes.", nodeRouter)
  .merge("graph.", graphsRouter)

// export type definition of API
export type AppRouter = typeof appRouter;

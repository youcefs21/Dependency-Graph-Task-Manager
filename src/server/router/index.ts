// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { nodeRouter } from "./nodes";
import { authRouter } from "./auth";
import {settingsRouter} from "./settings";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("nodes.", nodeRouter)
  .merge("settings.", settingsRouter)
  .merge("auth.", authRouter);

// export type definition of API
export type AppRouter = typeof appRouter;

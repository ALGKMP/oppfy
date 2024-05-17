import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./src/root";

import { createTRPCContext } from "./src/trpc";
import { openApiDocument } from "./src/root";
import { appRouter } from "./src/root";

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>;

export { createTRPCContext, openApiDocument , appRouter };
export type { AppRouter, RouterInputs, RouterOutputs };


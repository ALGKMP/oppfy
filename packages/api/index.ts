import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { DomainError, ErrorCode, handleMuxErrors } from "./src/errors";
import type { AppRouter } from "./src/root";
import { appRouter, createCaller, openApiDocument } from "./src/root";
import { createTRPCContext } from "./src/trpc";

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

export { createTRPCContext, openApiDocument, appRouter, createCaller };
export { DomainError, ErrorCode, handleMuxErrors };
export type { AppRouter, RouterInputs, RouterOutputs };

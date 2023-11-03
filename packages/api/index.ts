/* eslint-disable @typescript-eslint/no-misused-promises */
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-openapi";

import { appRouter, openApiDocument } from "./src/root";
import type { AppRouter } from "./src/root";
import { createTRPCContext } from "./src/trpc";

export { type AppRouter } from "./src/root";

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>;

const SERVER_PORT = 4000;
const app = express();

app.use(cors({ origin: "*" }));

// Handle incoming tRPC requests
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

// Handle incoming OpenAPI requests
app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

// Serve Swagger UI with our OpenAPI schema
app.use("/", swaggerUi.serve);
app.get("/", swaggerUi.setup(openApiDocument));

app.listen(SERVER_PORT, () =>
  console.log(`Server started on http://localhost:${SERVER_PORT}`),
);

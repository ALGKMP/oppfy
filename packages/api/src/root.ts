import { generateOpenApiDocument } from "trpc-openapi";

import { authRouter } from "./router/auth";
// import { profilePhotoRouter } from "./router/profile";
import { mediaRouter } from "./router/media";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  media: mediaRouter,
});

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "tRPC OpenAPI",
  version: "1.0.0",
  baseUrl: "http://localhost:3000/api",
});

// export type definition of API
export type AppRouter = typeof appRouter;

import { generateOpenApiDocument } from "trpc-openapi";
import { createTRPCRouter } from "./trpc";

import { authRouter } from "./router/auth";
import { profileRouter } from "./router/profile";
import { mediaRouter } from "./router/media";
import { postRouter } from "./router/post";
import { userRouter } from "./router/user";
export const appRouter = createTRPCRouter({
  auth: authRouter,
  media: mediaRouter,
  profile: profileRouter,
  post: postRouter,
  user: userRouter,
});

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "tRPC OpenAPI",
  version: "1.0.0",
  baseUrl: "http://localhost:3000/api",
});

// export type definition of API
export type AppRouter = typeof appRouter;

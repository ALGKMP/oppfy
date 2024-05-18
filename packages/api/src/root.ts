import { generateOpenApiDocument } from "trpc-openapi";

import { authRouter } from "./routers/auth";
import { postRouter } from "./routers/post";
import { profileRouter } from "./routers/profile";
import { searchRouter } from "./routers/search";
import { userRouter } from "./routers/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  profile: profileRouter,
  post: postRouter,
  user: userRouter,
  search: searchRouter,
});

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "tRPC OpenAPI",
  version: "1.0.0",
  baseUrl: "http://localhost:3000/api",
});

// export type definition of API
export type AppRouter = typeof appRouter;

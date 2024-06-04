import { generateOpenApiDocument } from "trpc-openapi";

import {
  blockRouter,
  followRouter,
  friendRouter,
  notificationsRouter,
  postRouter,
  profileRouter,
  requestRouter,
  searchRouter,
  userRouter,
} from "./routers";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  profile: profileRouter,
  post: postRouter,
  follow: followRouter,
  friend: friendRouter,
  request: requestRouter,
  block: blockRouter,
  notifications: notificationsRouter,
  search: searchRouter,
});

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "tRPC OpenAPI",
  version: "1.0.0",
  baseUrl: "http://localhost:3000/api",
});

// export type definition of API
export type AppRouter = typeof appRouter;

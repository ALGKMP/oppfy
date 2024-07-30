import { generateOpenApiDocument } from "trpc-openapi";

import {
  blockRouter,
  contactsRouter,
  followRouter,
  friendRouter,
  notifitionsRouter,
  postRouter,
  profileRouter,
  reportRouter,
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
  contacts: contactsRouter,
  search: searchRouter,
  report: reportRouter,
});

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "tRPC OpenAPI",
  version: "1.0.0",
  // baseUrl: "http://localhost:3000/api",
  baseUrl: "https://www.oppfy.app/api",
});

// export type definition of API
export type AppRouter = typeof appRouter;

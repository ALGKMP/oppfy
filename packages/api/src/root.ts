import { generateOpenApiDocument } from "trpc-openapi";


import { env } from "@oppfy/env";

import {
  blockRouter,
  contactsRouter,
  followRouter,
  friendRouter,
  notificationsRouter,
  postRouter,
  profileRouter,
  reportRouter,
  requestRouter,
  searchRouter,
  userRouter,
  pendingUserRouter
} from "./routers";
import { createTRPCRouter, createCallerFactory } from "./trpc";

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
  pendingUser: pendingUserRouter,
});

export const createCaller = createCallerFactory(appRouter);

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "tRPC OpenAPI",
  version: "1.0.0",
  baseUrl: env.EXPO_PUBLIC_API_URL,
});

// export type definition of API
export type AppRouter = typeof appRouter;

import { generateOpenApiDocument } from "trpc-openapi";

import { env } from "@oppfy/env";

import { postRouter } from "./routers/content/post.router";
import { postInteractionRouter } from "./routers/content/postInteraction.router";
import { blockRouter } from "./routers/social/block.router";
import { followRouter } from "./routers/social/follow.router";
import { friendRouter } from "./routers/social/friend.router";
import { reportRouter } from "./routers/social/report.router";
import { authRouter } from "./routers/user/auth.router";
import { contactsRouter } from "./routers/user/contacts.router";
import { notificationRouter } from "./routers/user/notification.router";
import { profileRouter } from "./routers/user/profile.router";
import { userRouter } from "./routers/user/user.router";
import { createCallerFactory, createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  profile: profileRouter,
  post: postRouter,
  postInteraction: postInteractionRouter,
  follow: followRouter,
  friend: friendRouter,
  block: blockRouter,
  report: reportRouter,
  contacts: contactsRouter,
  notification: notificationRouter,
});

export const createCaller = createCallerFactory(appRouter);

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "tRPC OpenAPI",
  version: "1.0.0",
  baseUrl: env.EXPO_PUBLIC_API_URL,
});

// export type definition of API
export type AppRouter = typeof appRouter;

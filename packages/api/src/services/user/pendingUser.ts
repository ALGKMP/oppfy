import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@oppfy/db";
import { pendingUser, postOfUserNotOnApp, user } from "@oppfy/db/schema";

export const PendingUserService = {
  async createOrGetPendingUser({
    phoneNumber,
    name,
  }: {
    phoneNumber: string;
    name?: string;
  }) {
    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.phoneNumber, phoneNumber),
    });

    if (existingUser) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User already exists with this phone number",
      });
    }

    // Check if pending user exists
    let pendingUserRecord = await db.query.pendingUser.findFirst({
      where: eq(pendingUser.phoneNumber, phoneNumber),
    });

    // If no pending user exists, create one
    if (!pendingUserRecord) {
      pendingUserRecord = await db
        .insert(pendingUser)
        .values({
          phoneNumber,
          name,
        })
        .returning()
        .then((res) => res[0]);
    }

    return pendingUserRecord;
  },

  async createPostForPendingUser({
    authorId,
    pendingUserId,
    phoneNumber,
    mediaKey,
    caption,
    width,
    height,
    mediaType,
  }: {
    authorId: string;
    pendingUserId: string;
    phoneNumber: string;
    mediaKey: string;
    caption: string;
    width: number;
    height: number;
    mediaType: "image" | "video";
  }) {
    const post = await db
      .insert(postOfUserNotOnApp)
      .values({
        authorId,
        pendingUserId,
        phoneNumber,
        key: mediaKey,
        caption,
        width,
        height,
        mediaType,
      })
      .returning();

    return post[0];
  },

  async getPendingUserPosts(pendingUserId: string) {
    return db.query.postOfUserNotOnApp.findMany({
      where: eq(postOfUserNotOnApp.pendingUserId, pendingUserId),
      with: {
        author: {
          with: {
            profile: true,
          },
        },
      },
    });
  },

  async migratePendingUserPosts({
    pendingUserId,
    newUserId,
  }: {
    pendingUserId: string;
    newUserId: string;
  }) {
    // This will be implemented when we create the migration flow
    // It will move posts from postOfUserNotOnApp to the regular posts table
    // and delete the pending user
  },
};

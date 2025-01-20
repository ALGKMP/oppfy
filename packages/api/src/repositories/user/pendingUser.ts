import { and, eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class PendingUserRepository {
  private db = db;

  @handleDatabaseErrors
  async findByPhoneNumber(phoneNumber: string) {
    return this.db.query.pendingUser.findFirst({
      where: eq(schema.pendingUser.phoneNumber, phoneNumber),
    });
  }

  @handleDatabaseErrors
  async create(data: { phoneNumber: string }) {
    return this.db
      .insert(schema.pendingUser)
      .values(data)
      .returning()
      .then((res) => res[0]);
  }

  @handleDatabaseErrors
  async findPostsByPendingUserId(pendingUserId: string) {
    return this.db.query.postOfUserNotOnApp.findMany({
      where: eq(schema.postOfUserNotOnApp.pendingUserId, pendingUserId),
      with: {
        author: {
          with: {
            profile: true,
          },
        },
      },
    });
  }

  @handleDatabaseErrors
  async findPostsByPhoneNumber(phoneNumber: string) {
    const pendingUserRecord = await this.findByPhoneNumber(phoneNumber);
    if (!pendingUserRecord) return [];

    return this.findPostsByPendingUserId(pendingUserRecord.id);
  }

  @handleDatabaseErrors
  async updateUserPendingPostsStatus(userId: string, postCount: number) {
    await this.db
      .update(schema.user)
      .set({
        hasPendingPosts: postCount > 0,
        pendingPostsCount: postCount,
      })
      .where(eq(schema.user.id, userId));
  }

  @handleDatabaseErrors
  async migratePosts({
    pendingUserId,
    newUserId,
  }: {
    pendingUserId: string;
    newUserId: string;
  }) {
    return await this.db.transaction(async (tx) => {
      const pendingPosts = await this.db.query.postOfUserNotOnApp.findMany({
        where: eq(schema.postOfUserNotOnApp.pendingUserId, pendingUserId),
        with: {
          author: true,
        },
      });

      const migratedPosts = await Promise.all(
        pendingPosts.map(async (pendingPost) => {
          // Create new post
          const newPost = await tx
            .insert(schema.post)
            .values({
              authorId: pendingPost.authorId,
              recipientId: newUserId,
              caption: pendingPost.caption,
              key: pendingPost.key,
              width: pendingPost.width,
              height: pendingPost.height,
              mediaType: pendingPost.mediaType,
            })
            .returning()
            .then((res) => res[0]);

          // Delete pending post
          await tx
            .delete(schema.postOfUserNotOnApp)
            .where(eq(schema.postOfUserNotOnApp.id, pendingPost.id));

          return newPost;
        }),
      );

      // Delete pending user
      await tx
        .delete(schema.pendingUser)
        .where(eq(schema.pendingUser.id, pendingUserId));

      // Update user status
      await tx
        .update(schema.user)
        .set({
          hasPendingPosts: false,
          pendingPostsCount: 0,
        })
        .where(eq(schema.user.id, newUserId));

      return migratedPosts;
    });
  }
}

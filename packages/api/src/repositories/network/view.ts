import { eq, sql } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class ViewRepository {
  private db = db;

  // View post (create post view)
  @handleDatabaseErrors
  async viewPost({ userId, postId }: { userId: string; postId: string }) {
    return await this.db.transaction(async (tx) => {
      // Create a new post view
      await tx.insert(schema.postView).values({
        userId,
        postId,
      });

      // Increment the views count in post stats
      await tx
        .update(schema.postStats)
        .set({ views: sql`${schema.postStats.views} + 1` })
        .where(eq(schema.postStats.postId, postId));
    });
  }

  // View multiple posts
  @handleDatabaseErrors
  async viewMultiplePosts({
    userId,
    postIds,
  }: {
    userId: string;
    postIds: string[];
  }) {
    return await this.db.transaction(async (tx) => {
      for (const postId of postIds) {
        // Create a new post view for each postId
        await tx.insert(schema.postView).values({
          userId,
          postId,
        });

        // Increment the views count in post stats for each postId
        await tx
          .update(schema.postStats)
          .set({ views: sql`${schema.postStats.views} + 1` })
          .where(eq(schema.postStats.postId, postId));
      }
    });
  }
}

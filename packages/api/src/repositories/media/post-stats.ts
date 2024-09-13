import { eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class PostStatsRepository {
  private db = db;

  @handleDatabaseErrors
  async getPostStats(postId: string) {
    return await this.db.query.postStats.findFirst({
      where: eq(schema.postStats.postId, postId),
    });
  }

  @handleDatabaseErrors
  async createPostStats(postId: string) {
    const result = await this.db.insert(schema.postStats).values({ postId });
    return result;
  }

  @handleDatabaseErrors
  async incrementCommentsCount(postId: string) {
    const currentStats = await this.db.query.postStats.findFirst({
      where: eq(schema.postStats.postId, postId),
    });

    if (currentStats) {
      await this.db
        .update(schema.postStats)
        .set({ comments: currentStats.comments + 1 })
        .where(eq(schema.postStats.postId, postId));
    }
  }

  @handleDatabaseErrors
  async decrementCommentsCount(postId: string) {
    const currentStats = await this.db.query.postStats.findFirst({
      where: eq(schema.postStats.postId, postId),
    });

    if (currentStats) {
      await this.db
        .update(schema.postStats)
        .set({ comments: currentStats.comments - 1 })
        .where(eq(schema.postStats.postId, postId));
    }
  }

  @handleDatabaseErrors
  async incrementLikesCount(postId: string) {
    const currentStats = await this.db.query.postStats.findFirst({
      where: eq(schema.postStats.postId, postId),
    });

    if (currentStats) {
      await this.db
        .update(schema.postStats)
        .set({ likes: currentStats.likes + 1 })
        .where(eq(schema.postStats.postId, postId));
    }
  }

  @handleDatabaseErrors
  async decrementLikesCount(postId: string) {
    const currentStats = await this.db.query.postStats.findFirst({
      where: eq(schema.postStats.postId, postId),
    });

    if (currentStats) {
      await this.db
        .update(schema.postStats)
        .set({ likes: currentStats.likes - 1 })
        .where(eq(schema.postStats.postId, postId));
    }
  }

  @handleDatabaseErrors
  async updatePostStats(
    { postId, likes, comments, views }: { postId: string; likes: number; comments: number; views: number }
  ) {
    await this.db
      .update(schema.postStats)
      .set({
        likes,
        comments,
        views,
      })
      .where(eq(schema.postStats.postId, postId));
  }

  @handleDatabaseErrors
  async deletePostStats(postId: string) {
    await this.db
      .delete(schema.postStats)
      .where(eq(schema.postStats.postId, postId));
  }
}

import { eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class PostStatsRepository {
  private db = db;

  @handleDatabaseErrors
  async getPostStats(postId: number) {
    return await this.db.query.postStats.findFirst({
      where: eq(schema.postStats.postId, postId),
    });
  }

  @handleDatabaseErrors
  async createPostStats(postId: number) {
    const result = await this.db.insert(schema.postStats).values({ postId });
    return result;
  }

  @handleDatabaseErrors
  async incrementCommentsCount(postId: number) {
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
  async decrementCommentsCount(postId: number) {
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
  async incrementLikesCount(postId: number) {
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
  async decrementLikesCount(postId: number) {
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
    postId: number,
    likes: number,
    comments: number,
    views: number,
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
  async deletePostStats(postId: number) {
    await this.db
      .delete(schema.postStats)
      .where(eq(schema.postStats.postId, postId));
  }
}

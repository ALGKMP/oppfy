import { eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../../errors";
import type { IPostStatsRepository, PostStats } from "../interfaces/post-repository.interface";

export class PostStatsRepository implements IPostStatsRepository {
  private db = db;

  @handleDatabaseErrors
  async getPostStats(postId: string): Promise<PostStats | undefined> {
    return await this.db.query.postStats.findFirst({
      where: eq(schema.postStats.postId, postId),
    });
  }

  @handleDatabaseErrors
  async incrementCommentsCount(postId: string): Promise<void> {
    const currentStats = await this.getPostStats(postId);
    if (currentStats) {
      await this.db
        .update(schema.postStats)
        .set({ comments: currentStats.comments + 1 })
        .where(eq(schema.postStats.postId, postId));
    }
  }

  @handleDatabaseErrors
  async decrementCommentsCount(postId: string): Promise<void> {
    const currentStats = await this.getPostStats(postId);
    if (currentStats) {
      await this.db
        .update(schema.postStats)
        .set({ comments: currentStats.comments - 1 })
        .where(eq(schema.postStats.postId, postId));
    }
  }

  @handleDatabaseErrors
  async incrementLikesCount(postId: string): Promise<void> {
    const currentStats = await this.getPostStats(postId);
    if (currentStats) {
      await this.db
        .update(schema.postStats)
        .set({ likes: currentStats.likes + 1 })
        .where(eq(schema.postStats.postId, postId));
    }
  }

  @handleDatabaseErrors
  async decrementLikesCount(postId: string): Promise<void> {
    const currentStats = await this.getPostStats(postId);
    if (currentStats) {
      await this.db
        .update(schema.postStats)
        .set({ likes: currentStats.likes - 1 })
        .where(eq(schema.postStats.postId, postId));
    }
  }
}

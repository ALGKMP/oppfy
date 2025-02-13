import { eq, sql } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../../errors";
import type {
  IPostStatsRepository,
  PostStats,
} from "../interfaces/post-repository.interface";

export class PostStatsRepository implements IPostStatsRepository {
  private db = db;

  @handleDatabaseErrors
  async getPostStats(postId: string): Promise<PostStats | undefined> {
    return await this.db.query.postStats.findFirst({
      where: eq(schema.postStats.postId, postId),
    });
  }

  @handleDatabaseErrors
  async createPostStats(postId: string): Promise<PostStats> {
    const [stats] = await this.db
      .insert(schema.postStats)
      .values({ postId })
      .returning();

    if (!stats) {
      throw new Error("Failed to create post stats");
    }

    return stats;
  }

  @handleDatabaseErrors
  async incrementCommentsCount(postId: string): Promise<void> {
    await this.db
      .update(schema.postStats)
      .set({ comments: sql`${schema.postStats.comments} + 1` })
      .where(eq(schema.postStats.postId, postId));
  }

  @handleDatabaseErrors
  async decrementCommentsCount(postId: string): Promise<void> {
    await this.db
      .update(schema.postStats)
      .set({ comments: sql`${schema.postStats.comments} - 1` })
      .where(eq(schema.postStats.postId, postId));
  }

  @handleDatabaseErrors
  async incrementLikesCount(postId: string): Promise<void> {
    await this.db
      .update(schema.postStats)
      .set({ likes: sql`${schema.postStats.likes} + 1` })
      .where(eq(schema.postStats.postId, postId));
  }

  @handleDatabaseErrors
  async decrementLikesCount(postId: string): Promise<void> {
    await this.db
      .update(schema.postStats)
      .set({ likes: sql`${schema.postStats.likes} - 1` })
      .where(eq(schema.postStats.postId, postId));
  }

  @handleDatabaseErrors
  async incrementViewsCount(postId: string): Promise<void> {
    await this.db
      .update(schema.postStats)
      .set({ views: sql`${schema.postStats.views} + 1` })
      .where(eq(schema.postStats.postId, postId));
  }
}

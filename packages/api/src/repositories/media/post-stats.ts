import { eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class PostStatsRepository {
  private db = db;

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

}

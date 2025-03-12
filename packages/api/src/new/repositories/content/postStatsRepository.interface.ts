import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, Schema, Transaction } from "@oppfy/db";

import { TYPES } from "../container";
import {
  IPostStatsRepository,
  UpdatePostStatsParams,
} from "../interfaces/repositories/content/postStatsRepository.interface";

@injectable()
export class PostStatsRepository implements IPostStatsRepository {
  private readonly db: Database;
  private readonly schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async incrementCommentsCount(
    { postId }: UpdatePostStatsParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    const currentStats = await tx.query.postStats.findFirst({
      where: eq(this.schema.postStats.postId, postId),
    });

    if (currentStats) {
      await tx
        .update(this.schema.postStats)
        .set({ comments: currentStats.comments + 1 })
        .where(eq(this.schema.postStats.postId, postId));
    }
  }

  async decrementCommentsCount(
    { postId }: UpdatePostStatsParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    const currentStats = await tx.query.postStats.findFirst({
      where: eq(this.schema.postStats.postId, postId),
    });

    if (currentStats) {
      await tx
        .update(this.schema.postStats)
        .set({ comments: currentStats.comments - 1 })
        .where(eq(this.schema.postStats.postId, postId));
    }
  }

  async incrementLikesCount(
    { postId }: UpdatePostStatsParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    const currentStats = await tx.query.postStats.findFirst({
      where: eq(this.schema.postStats.postId, postId),
    });

    if (currentStats) {
      await tx
        .update(this.schema.postStats)
        .set({ likes: currentStats.likes + 1 })
        .where(eq(this.schema.postStats.postId, postId));
    }
  }

  async decrementLikesCount(
    { postId }: UpdatePostStatsParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    const currentStats = await tx.query.postStats.findFirst({
      where: eq(this.schema.postStats.postId, postId),
    });

    if (currentStats) {
      await tx
        .update(this.schema.postStats)
        .set({ likes: currentStats.likes - 1 })
        .where(eq(this.schema.postStats.postId, postId));
    }
  }
}

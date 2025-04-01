import { and, eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";

import { TYPES } from "../../container";
import type {
  ILikeRepository,
  LikeParams,
} from "../../interfaces/repositories/content/like.repository.interface";
import type { Like } from "../../models";

@injectable()
export class LikeRepository implements ILikeRepository {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.Schema) private readonly schema: Schema,
  ) {}

  async getLike(
    { postId, userId }: LikeParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Like | undefined> {
    const result = await db
      .select()
      .from(this.schema.like)
      .where(
        and(
          eq(this.schema.like.postId, postId),
          eq(this.schema.like.userId, userId),
        ),
      )
      .limit(1);

    return result[0];
  }

  async createLike(
    { postId, userId }: LikeParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx
      .insert(this.schema.like)
      .values({
        postId,
        userId,
        createdAt: new Date(),
      })
      .onConflictDoNothing(); // Prevents duplicate likes

    await tx
      .update(this.schema.postStats)
      .set({
        likes: sql`likes + 1`,
      })
      .where(eq(this.schema.postStats.postId, postId));
  }

  async deleteLike(
    { postId, userId }: LikeParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx
      .delete(this.schema.like)
      .where(
        and(
          eq(this.schema.like.postId, postId),
          eq(this.schema.like.userId, userId),
        ),
      );

    await tx
      .update(this.schema.postStats)
      .set({
        likes: sql`likes - 1`,
      })
      .where(eq(this.schema.postStats.postId, postId));
  }
}

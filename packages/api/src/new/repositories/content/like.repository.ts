import { and, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";
import { TYPES } from "../../container";
import type { LikeParams, ILikeRepository } from "../../interfaces/repositories/content/like.repository.interface";
import type { Like } from "../../models";

@injectable()
export class LikeRepository implements ILikeRepository {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.Schema) private readonly schema: Schema,
  ) {}

  async addLike(
    { postId, userId }: LikeParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx.insert(this.schema.like).values({
      postId,
      userId,
      createdAt: new Date(),
    }).onConflictDoNothing(); // Prevents duplicate likes
  }

  async removeLike(
    { postId, userId }: LikeParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const result = await tx
      .delete(this.schema.like)
      .where(
        and(
          eq(this.schema.like.postId, postId),
          eq(this.schema.like.userId, userId),
        ),
      );

    if (result.length === 0) {
      throw new Error("Like not found");
    }
  }

  async findLike(
    { postId, userId }: LikeParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<Like | undefined> {
    const result = await tx
      .select()
      .from(this.schema.like)
      .where(
        and(
          eq(this.schema.like.postId, postId),
          eq(this.schema.like.userId, userId),
        ),
      )
      .limit(1);

    return result[0]; // Returns the Like object or undefined if not found
  }
}
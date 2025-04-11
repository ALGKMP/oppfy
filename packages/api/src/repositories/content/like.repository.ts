import { and, eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import type { Like } from "../../models";
import { TYPES } from "../../types";

export interface LikeParams {
  userId: string;
  postId: string;
}

@injectable()
export class LikeRepository {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.Schema) private readonly schema: Schema,
  ) {}

  async getLike(
    { postId, userId }: LikeParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Like | undefined> {
    const like = await db.query.like.findFirst({
      where: and(
        eq(this.schema.like.postId, postId),
        eq(this.schema.like.userId, userId),
      ),
    });

    return like;
  }

  async createLike(
    { postId, userId }: LikeParams,
    tx: Transaction,
  ): Promise<void> {
    await tx.insert(this.schema.like).values({
      postId,
      userId,
    });

    await tx
      .update(this.schema.postStats)
      .set({
        likes: sql`likes + 1`,
      })
      .where(eq(this.schema.postStats.postId, postId));
  }

  async deleteLike(
    { postId, userId }: LikeParams,
    tx: Transaction,
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

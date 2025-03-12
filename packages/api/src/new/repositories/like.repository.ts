// repositories/likeRepository.ts
import { and, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, Schema, Transaction } from "@oppfy/db";

import { TYPES } from "../container";
import {
  AddLikeParams,
  FindLikeParams,
  ILikeRepository,
  RemoveLikeParams,
} from "../interfaces/repositories/likeRepository.interface";
import { Like } from "../models";

@injectable()
export class LikeRepository implements ILikeRepository {
  private readonly db: Database;
  private readonly schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async addLike(
    { postId, userId }: AddLikeParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    await tx.insert(this.schema.like).values({
      postId,
      userId,
      createdAt: new Date(),
    });
  }

  async removeLike(
    { postId, userId }: RemoveLikeParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    await tx
      .delete(this.schema.like)
      .where(
        and(
          eq(this.schema.like.postId, postId),
          eq(this.schema.like.userId, userId),
        ),
      );
  }

  async findLike(
    { postId, userId }: FindLikeParams,
    tx: Database | Transaction = this.db,
  ): Promise<Like | undefined> {
    return await tx.query.like.findFirst({
      where: and(
        eq(this.schema.like.postId, postId),
        eq(this.schema.like.userId, userId),
      ),
    });
  }
}

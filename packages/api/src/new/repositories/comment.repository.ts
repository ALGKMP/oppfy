import { and, count, desc, eq, lte } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, Schema, Transaction } from "@oppfy/db";

import { TYPES } from "../container"; // Adjust based on your DI setup
import {
  AddCommentParams,
  Comment,
  ICommentRepository,
  PaginateCommentsParams,
  PaginatedComment,
} from "../interfaces/repositories/commentRepository.interface";

@injectable()
export class CommentRepository implements ICommentRepository {
  private readonly db: Database;
  private readonly schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async getComment(
    commentId: string,
    tx: Database | Transaction = this.db,
  ): Promise<Comment | undefined> {
    return await tx.query.comment.findFirst({
      where: eq(this.schema.comment.id, commentId),
    });
  }

  async addComment(
    params: AddCommentParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    await tx.insert(this.schema.comment).values({
      postId: params.postId,
      userId: params.userId,
      body: params.body,
    });
  }

  async removeComment(
    commentId: string,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    await tx
      .delete(this.schema.comment)
      .where(eq(this.schema.comment.id, commentId));
  }

  async countComments(
    postId: string,
    tx: Database | Transaction = this.db,
  ): Promise<number> {
    const result = await tx
      .select({ count: count() })
      .from(this.schema.comment)
      .where(eq(this.schema.comment.postId, postId));

    return result[0]?.count ?? 0;
  }

  async paginateComments(
    { postId, cursor, pageSize = 10 }: PaginateCommentsParams,
    tx: Database | Transaction = this.db,
  ): Promise<PaginatedComment[]> {
    const results = await tx
      .select({
        commentId: this.schema.comment.id,
        userId: this.schema.comment.userId,
        username: this.schema.profile.username,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        postId: this.schema.comment.postId,
        body: this.schema.comment.body,
        createdAt: this.schema.comment.createdAt,
      })
      .from(this.schema.comment)
      .innerJoin(
        this.schema.user,
        eq(this.schema.user.id, this.schema.comment.userId),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.profile.userId, this.schema.user.id),
      )
      .where(
        and(
          eq(this.schema.comment.postId, postId),
          cursor
            ? lte(this.schema.comment.createdAt, cursor.createdAt)
            : undefined,
        ),
      )
      .orderBy(
        desc(this.schema.comment.createdAt),
        desc(this.schema.comment.id),
      )
      .limit(pageSize + 1);

    return results;
  }
}

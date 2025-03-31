import { and, count, desc, eq, lte, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
import {
  AddCommentParams,
  Comment,
  CountCommentsParams,
  GetCommentParams,
  ICommentRepository,
  PaginateCommentsParams,
  PaginatedComment,
  RemoveCommentParams,
} from "../../interfaces/repositories/content/comment.repository.interface";

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
    { commentId }: GetCommentParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Comment | undefined> {
    return await db.query.comment.findFirst({
      where: eq(this.schema.comment.id, commentId),
    });
  }

  async addComment(
    { postId, userId, body }: AddCommentParams,
    tx: Transaction,
  ): Promise<void> {
    await tx.insert(this.schema.comment).values({
      postId,
      userId,
      body,
    });

    await tx
      .update(this.schema.postStats)
      .set({
        comments: sql`comments + 1`,
      })
      .where(eq(this.schema.postStats.postId, postId));
  }

  async removeComment(
    { commentId, postId }: RemoveCommentParams,
    tx: Transaction,
  ): Promise<void> {
    await tx
      .delete(this.schema.comment)
      .where(eq(this.schema.comment.id, commentId));

    await tx
      .update(this.schema.postStats)
      .set({
        comments: sql`comments - 1`,
      })
      .where(eq(this.schema.postStats.postId, postId));
  }

  async countComments(
    { postId }: CountCommentsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(this.schema.comment)
      .where(eq(this.schema.comment.postId, postId));
    return result[0]?.count ?? 0;
  }

  async paginateComments(
    { postId, cursor, pageSize = 10 }: PaginateCommentsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<PaginatedComment[]> {
    const commentsAndProfiles = await db
      .select({
        comment: this.schema.comment,
        profile: this.schema.profile,
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
            ? or(
                lte(this.schema.comment.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.comment.createdAt, cursor.createdAt),
                  lte(this.schema.comment.id, cursor.commentId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        desc(this.schema.comment.createdAt),
        desc(this.schema.comment.id),
      )
      .limit(pageSize + 1);

    return commentsAndProfiles;
  }
}

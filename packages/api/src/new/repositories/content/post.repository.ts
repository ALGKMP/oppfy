import { aliasedTable, and, desc, eq, lt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
import {
  CreatePostStatsParams,
  DeletePostParams,
  GetPostForSiteParams,
  GetPostParams,
  IPostRepository,
  PaginatePostsParams,
  PostResult,
  PostResultWithLike,
  UpdatePostParams,
} from "../../interfaces/repositories/content/post.repository.interface";

@injectable()
export class PostRepository implements IPostRepository {
  private readonly aliasedSchema;

  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.Schema) private readonly schema: Schema,
  ) {
    this.aliasedSchema = {
      authorProfile: aliasedTable(this.schema.profile, "authorProfile"),
      recipientProfile: aliasedTable(this.schema.profile, "recipientProfile"),
    };
  }

  private baseQuery(userId?: string, tx: DatabaseOrTransaction = this.db) {
    const query = tx
      .select({
        authorProfile: this.aliasedSchema.authorProfile,
        recipientProfile: this.aliasedSchema.recipientProfile,
        post: this.schema.post,
        postStats: this.schema.postStats,
        like: this.schema.like,
      })
      .from(this.schema.post)
      .innerJoin(
        this.schema.postStats,
        eq(this.schema.postStats.postId, this.schema.post.id),
      )
      .innerJoin(
        this.aliasedSchema.authorProfile,
        eq(
          this.schema.post.authorUserId,
          this.aliasedSchema.authorProfile.userId,
        ),
      )
      .innerJoin(
        this.aliasedSchema.recipientProfile,
        eq(
          this.schema.post.recipientUserId,
          this.aliasedSchema.recipientProfile.userId,
        ),
      );
    if (userId) {
      query.leftJoin(
        this.schema.like,
        and(
          eq(this.schema.like.postId, this.schema.post.id),
          eq(this.schema.like.userId, userId),
        ),
      );
    }

    return query;
  }

  async getPost(
    { postId, userId }: GetPostParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult | undefined> {
    const query = this.baseQuery(userId, tx);
    const results = await query.where(eq(this.schema.post.id, postId)).limit(1);
    return results[0];
  }

  async getPostForSite(
    { postId }: GetPostForSiteParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResultWithLike | undefined> {
    const query = this.baseQuery(undefined, tx);
    const results = await query.where(eq(this.schema.post.id, postId)).limit(1);
    return results[0];
  }

  async paginatePostsOfFollowing(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult[]> {
    const query = this.baseQuery(userId, tx);

    let whereClause = or(
      eq(this.schema.follow.senderUserId, userId),
      eq(this.schema.post.authorUserId, userId),
    );

    if (cursor) {
      const cursorCondition = or(
        lt(this.schema.post.createdAt, cursor.createdAt),
        and(
          eq(this.schema.post.createdAt, cursor.createdAt),
          lt(this.schema.post.id, cursor.postId),
        ),
      );
      whereClause = and(whereClause, cursorCondition);
    }

    const results = await query
      .leftJoin(
        this.schema.follow,
        and(
          eq(this.schema.follow.senderUserId, userId),
          eq(this.schema.follow.recipientUserId, this.schema.post.authorUserId),
        ),
      )
      .where(whereClause)
      .orderBy(desc(this.schema.post.createdAt), desc(this.schema.post.id))
      .limit(pageSize + 1);

    return results;
  }

  async paginatePostsOfUser(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult[]> {
    const query = this.baseQuery(userId, tx);

    const whereClause = and(
      eq(this.schema.post.authorUserId, userId),
      cursor
        ? or(
            lt(this.schema.post.createdAt, cursor.createdAt),
            and(
              eq(this.schema.post.createdAt, cursor.createdAt),
              lt(this.schema.post.id, cursor.postId),
            ),
          )
        : undefined,
    );

    const results = await query
      .where(whereClause)
      .orderBy(desc(this.schema.post.createdAt), desc(this.schema.post.id))
      .limit(pageSize + 1);

    return results;
  }

  async updatePost(
    { postId, caption }: UpdatePostParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx
      .update(this.schema.post)
      .set({
        caption,
        updatedAt: new Date(),
      })
      .where(eq(this.schema.post.id, postId));
  }

  async createPostStats(
    { postId }: CreatePostStatsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx.insert(this.schema.postStats).values({
      postId,
    });
  }

  async deletePost(
    { userId, postId }: DeletePostParams,
    tx: Transaction,
  ): Promise<void> {
    await Promise.all([
      tx.delete(this.schema.post).where(eq(this.schema.post.id, postId)),
      tx
        .update(this.schema.userStats)
        .set({
          posts: sql`${this.schema.userStats.posts} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(this.schema.userStats.userId, userId)),
    ]);
  }
}

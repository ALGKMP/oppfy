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
  GetPostForNextJsParams,
  GetPostParams,
  IPostRepository,
  PaginatePostsParams,
  PostResult,
  PostResultWithoutLike,
  UpdatePostParams,
} from "../../interfaces/repositories/content/postRepository.interface";

@injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.Schema) private readonly schema: Schema,
  ) {}

  private baseQuery(userId?: string, tx: DatabaseOrTransaction = this.db) {
    const authorProfile = aliasedTable(this.schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(
      this.schema.profile,
      "recipientProfile",
    );

    const query = tx
      .select({
        authorProfile: authorProfile,
        recipientProfile: recipientProfile,
        post: this.schema.post,
        postStats: this.schema.postStats,
        like: this.schema.like,
      }) // Fetch all columns from all joined tables
      .from(this.schema.post)
      .innerJoin(
        this.schema.postStats,
        eq(this.schema.postStats.postId, this.schema.post.id),
      )
      .innerJoin(
        authorProfile,
        eq(this.schema.post.authorUserId, authorProfile.userId),
      )
      .innerJoin(
        recipientProfile,
        eq(this.schema.post.recipientUserId, recipientProfile.userId),
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

    return { query, authorProfile, recipientProfile };
  }

  async getPost(
    { postId, userId }: GetPostParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult | undefined> {
    const { query } = this.baseQuery(userId, tx);
    const results = await query.where(eq(this.schema.post.id, postId)).limit(1);
    return results[0]; // Return raw result or undefined
  }

  async getPostForNextJs(
    { postId }: GetPostForNextJsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResultWithoutLike | undefined> {
    const { query } = this.baseQuery(undefined, tx);
    const results = await query.where(eq(this.schema.post.id, postId)).limit(1);
    return results[0]; // Return raw result or undefined
  }

  async paginatePostsOfFollowing(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult[]> {
    const { query } = this.baseQuery(userId, tx);

    let whereClause = or(
      eq(this.schema.follow.senderId, userId),
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
          eq(this.schema.follow.senderId, userId),
          eq(this.schema.follow.recipientId, this.schema.post.authorUserId),
        ),
      )
      .where(whereClause)
      .orderBy(desc(this.schema.post.createdAt), desc(this.schema.post.id))
      .limit(pageSize + 1);

    return results; // Return raw results directly
  }

  async paginatePostsOfUser(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult[]> {
    const { query } = this.baseQuery(userId, tx);

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

    return results; // Return raw results directly
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
    const now = new Date();
    await tx.insert(this.schema.postStats).values({
      postId,
      likes: 0,
      comments: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  async deletePost(
    { userId, postId }: DeletePostParams,
    tx: Transaction,
  ): Promise<void> {
    const post = await tx.query.post.findFirst({
      where: eq(this.schema.post.id, postId),
      columns: { authorUserId: true },
    });

    if (!post) throw new Error("Post not found");
    if (post.authorUserId !== userId)
      throw new Error("Unauthorized: User does not own this post");

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

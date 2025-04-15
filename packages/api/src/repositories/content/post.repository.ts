import { aliasedTable, and, desc, eq, lt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";
import {
  withMultipleProfilesOnboardingCompleted,
  withOnboardingCompleted,
} from "@oppfy/db/utils/query-helpers";

import { PaginationParams, PostIdParam } from "../../interfaces/types";
import {
  Like,
  MediaType,
  Post,
  PostStats,
  PostStatus,
  Profile,
} from "../../models";
import { TYPES } from "../../symbols";

export interface GetPostParams {
  postId: string;
  userId: string;
}

export interface PaginatePostsParams extends PaginationParams {
  userId: string;
}

export interface UpdatePostParams {
  postId: string;
  caption: string;
}

export interface DeletePostParams {
  userId: string;
  postId: string;
}

export interface CreatePostParams {
  authorUserId: string;
  recipientUserId: string;
  caption: string;
  postKey: string;
  width: number;
  height: number;
  mediaType: MediaType;
  status: PostStatus;
}

export interface PostResult {
  post: Post;
  postStats: PostStats;
  authorProfile: Profile<"onboarded">;
  recipientProfile: Profile<"onboarded">;
  like: Like;
}

export interface PostResultWithLike extends PostResult {
  like: Like;
}

@injectable()
export class PostRepository {
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

  async createPost(
    {
      authorUserId,
      recipientUserId,
      caption,
      postKey,
      width,
      height,
      mediaType,
      status,
    }: CreatePostParams,
    tx: Transaction,
  ): Promise<Post | undefined> {
    // transaction to create post and post stats
    const [post] = await tx
      .insert(this.schema.post)
      .values({
        authorUserId,
        recipientUserId,
        caption,
        postKey,
        width,
        height,
        mediaType,
        status,
      })
      .returning();

    return post;
  }

  async createPostStats(
    { postId }: PostIdParam,
    tx: Transaction,
  ): Promise<void> {
    await tx.insert(this.schema.postStats).values({
      postId,
    });
  }

  async getPost(
    { postId, userId }: GetPostParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult | undefined> {
    const query = this.baseQuery(userId, tx);
    const results = await query.where(eq(this.schema.post.id, postId)).limit(1);

    if (results[0] === undefined) return undefined;
    return {
      ...results[0],
      authorProfile: results[0].authorProfile as Profile<"onboarded">,
      recipientProfile: results[0].recipientProfile as Profile<"onboarded">,
    };
  }

  async getPostForSite(
    { postId }: PostIdParam,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResultWithLike | undefined> {
    const query = this.baseQuery(undefined, tx);
    const results = await query.where(eq(this.schema.post.id, postId)).limit(1);

    if (results[0] === undefined) return undefined;
    return {
      ...results[0],
      authorProfile: results[0].authorProfile as Profile<"onboarded">,
      recipientProfile: results[0].recipientProfile as Profile<"onboarded">,
    };
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
          lt(this.schema.post.id, cursor.id),
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
      .limit(pageSize);

    return results.map((result) => ({
      ...result,
      authorProfile: result.authorProfile as Profile<"onboarded">,
      recipientProfile: result.recipientProfile as Profile<"onboarded">,
    }));
  }

  async paginatePostsOfUser(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult[]> {
    const query = this.baseQuery(userId, tx);

    const whereClause = and(
      eq(this.schema.post.recipientUserId, userId),
      cursor
        ? or(
            lt(this.schema.post.createdAt, cursor.createdAt),
            and(
              eq(this.schema.post.createdAt, cursor.createdAt),
              lt(this.schema.post.id, cursor.id),
            ),
          )
        : undefined,
    );

    const results = await query
      .where(whereClause)
      .orderBy(desc(this.schema.post.createdAt), desc(this.schema.post.id))
      .limit(pageSize);

    return results.map((result) => ({
      ...result,
      authorProfile: result.authorProfile as Profile<"onboarded">,
      recipientProfile: result.recipientProfile as Profile<"onboarded">,
    }));
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
      )
      .$dynamic();

    if (userId) {
      query.leftJoin(
        this.schema.like,
        and(
          eq(this.schema.like.postId, this.schema.post.id),
          eq(this.schema.like.userId, userId),
        ),
      );
    }

    // Apply onboarding filter to both author and recipient profiles
    return withMultipleProfilesOnboardingCompleted(query, [
      this.aliasedSchema.authorProfile,
      this.aliasedSchema.recipientProfile,
    ]);
  }
}

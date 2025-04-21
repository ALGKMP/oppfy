import { aliasedTable, and, desc, eq, lt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";
import {
  isLikedSql,
  onboardingCompletedCondition,
} from "@oppfy/db/utils/query-helpers";

import { Post, PostInsert, PostStats, Profile } from "../../models";
import { TYPES } from "../../symbols";
import { PaginationParams, PostIdParam } from "../../types";
import { invariant } from "../../utils";

export interface GetPostParams {
  userId: string;
  postId: string;
}

export interface CreatePostParams {
  authorUserId: string;
  recipientUserId: string;
  caption: string;
  height: number;
  width: number;
  mediaType: "image" | "video";
  postKey: string;
}

export interface DeletePostParams {
  userId: string;
  postId: string;
}

export interface PaginatePostsParams extends PaginationParams {
  userId: string;
}

export interface PostResult<
  T extends "withIsLiked" | "withoutIsLiked" | undefined = undefined,
> {
  post: Post;
  postStats: PostStats;
  authorProfile: Profile<"onboarded">;
  recipientProfile: Profile<"notOnApp">;
  isLiked: T extends "withIsLiked" ? boolean : undefined;
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

  async getPost(
    { userId, postId }: GetPostParams,
    db: Database = this.db,
  ): Promise<PostResult<"withIsLiked"> | undefined> {
    let query = this.baseQuery(userId, db);
    query = query.where(eq(this.schema.post.id, postId)).limit(1);

    const [result] = await query;

    if (result === undefined) {
      return undefined;
    }

    return {
      ...result,
      authorProfile: result.authorProfile as Profile<"onboarded">,
      recipientProfile: result.recipientProfile as Profile<"notOnApp">,
      isLiked: result.isLiked ?? false,
    };
  }

  async getPostForSite(
    { postId }: PostIdParam,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult | undefined> {
    let query = this.baseQuery(undefined, tx);
    query = query.where(eq(this.schema.post.id, postId)).limit(1);

    const [result] = await query;

    if (result === undefined) {
      return undefined;
    }

    return {
      ...result,
      authorProfile: result.authorProfile as Profile<"onboarded">,
      recipientProfile: result.recipientProfile as Profile<"notOnApp">,
      isLiked: undefined,
    };
  }

  async createPost(
    params: CreatePostParams,
    tx: Transaction,
  ): Promise<{ post: Post; postStats: PostStats }> {
    const [post] = await tx
      .insert(this.schema.post)
      .values({
        ...params,
        status: "pending",
      })
      .returning();

    invariant(post);

    const [postStats] = await tx
      .insert(this.schema.postStats)
      .values({
        postId: post.id,
      })
      .returning();

    invariant(postStats);

    return { post, postStats };
  }

  async paginatePostsOfFollowing(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult<"withIsLiked">[]> {
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
      recipientProfile: result.recipientProfile as Profile<"notOnApp">,
      isLiked: result.isLiked ?? false,
    }));
  }

  async paginatePostsOfUser(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<PostResult<"withIsLiked">[]> {
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
      isLiked: result.isLiked ?? false,
    }));
  }

  async updatePost(
    values: PostInsert & { id: string },
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx
      .update(this.schema.post)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(this.schema.post.id, values.id));
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
    let query = tx
      .select({
        authorProfile: this.aliasedSchema.authorProfile,
        recipientProfile: this.aliasedSchema.recipientProfile,
        post: this.schema.post,
        postStats: this.schema.postStats,
        ...(userId
          ? { isLiked: isLikedSql(userId) }
          : { isLiked: sql<boolean>`false` }),
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

    query = query.where(
      onboardingCompletedCondition(this.aliasedSchema.authorProfile),
    );

    return query;
  }
}

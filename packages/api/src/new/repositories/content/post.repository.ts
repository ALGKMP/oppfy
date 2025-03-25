import { aliasedTable, and, desc, eq, lt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, Schema, SQL, Transaction } from "@oppfy/db";
import { TYPES } from "../../container";
import {
  CreatePostStatsParams,
  DeletePostParams,
  GetPostForNextJsParams,
  GetPostParams,
  IPostRepository,
  PaginatedPost,
  PaginatePostsParams,
  Post,
  PostForNextJs,
  UpdatePostParams,
} from "../../interfaces/repositories/content/postRepository.interface";

@injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.Schema) private readonly schema: Schema,
  ) {}

  private getBaseQuery(userId?: string, tx: Database | Transaction = this.db) {
    const author = aliasedTable(this.schema.user, "author");
    const recipient = aliasedTable(this.schema.user, "recipient");
    const authorProfile = aliasedTable(this.schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(this.schema.profile, "recipientProfile");

    const baseSelect = {
      postId: this.schema.post.id,
      authorId: this.schema.post.authorId,
      authorUsername: authorProfile.username,
      authorProfileId: authorProfile.id,
      authorProfilePicture: authorProfile.profilePictureKey,
      authorName: authorProfile.name,
      recipientId: this.schema.post.recipientId,
      recipientProfileId: recipientProfile.id,
      recipientUsername: recipientProfile.username,
      recipientProfilePicture: recipientProfile.profilePictureKey,
      recipientName: recipientProfile.name,
      caption: this.schema.post.caption,
      imageUrl: this.schema.post.key,
      width: this.schema.post.width,
      height: this.schema.post.height,
      commentsCount: this.schema.postStats.comments,
      likesCount: this.schema.postStats.likes,
      mediaType: this.schema.post.mediaType,
      createdAt: this.schema.post.createdAt,
    };

    const query = tx
      .selectDistinct({
        ...baseSelect,
        ...(userId && {
          hasLiked: sql<boolean>`
            CASE WHEN ${this.schema.like.userId} IS NOT NULL 
            THEN true 
            ELSE false 
            END
          `.as("has_liked"),
        }),
      })
      .from(this.schema.post)
      .innerJoin(this.schema.postStats, eq(this.schema.postStats.postId, this.schema.post.id))
      .innerJoin(author, eq(this.schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(authorProfile.userId, author.id))
      .innerJoin(recipient, eq(this.schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipientProfile.userId, recipient.id));

    if (userId) {
      query.leftJoin(
        this.schema.like,
        and(
          eq(this.schema.like.postId, this.schema.post.id),
          eq(this.schema.like.userId, userId),
        ),
      );
    }

    return { query, author, recipient, authorProfile, recipientProfile };
  }

  async getPost(
    { postId, userId }: GetPostParams,
    tx: Database | Transaction = this.db,
  ): Promise<Post | undefined> {
    const { query } = this.getBaseQuery(userId, tx);
    const results = await query
      .where(eq(this.schema.post.id, postId))
      .limit(1);
    return results[0];
  }

  async getPostForNextJs(
    { postId }: GetPostForNextJsParams,
    tx: Database | Transaction = this.db,
  ): Promise<PostForNextJs | undefined> {
    const { query } = this.getBaseQuery(undefined, tx);
    const results = await query
      .where(eq(this.schema.post.id, postId))
      .limit(1);
    return results[0];
  }

  async paginatePostsOfFollowing(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: Database | Transaction = this.db,
  ): Promise<PaginatedPost[]> {
    const { query } = this.getBaseQuery(userId, tx);

    let whereClause = or(
      eq(this.schema.follow.senderId, userId),
      eq(this.schema.post.authorId, userId)
    );

    if (cursor) {
      const cursorCondition = or(
        lt(this.schema.post.createdAt, cursor.createdAt),
        and(
          eq(this.schema.post.createdAt, cursor.createdAt),
          lt(this.schema.post.id, cursor.postId)
        )
      );
      whereClause = and(whereClause, cursorCondition);
    }

    const results = await query
      .leftJoin(
        this.schema.follow,
        and(
          eq(this.schema.follow.senderId, userId),
          eq(this.schema.follow.recipientId, this.schema.post.authorId),
        ),
      )
      .where(whereClause)
      .orderBy(desc(this.schema.post.createdAt), desc(this.schema.post.id))
      .limit(pageSize + 1);

    return results;
  }

  async paginatePostsOfUser(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: Database | Transaction = this.db,
  ): Promise<PaginatedPost[]> {
    const { query } = this.getBaseQuery(userId, tx);

    let whereClause: SQL<unknown> | undefined = eq(this.schema.post.authorId, userId);

    if (cursor) {
      const cursorCondition = or(
        lt(this.schema.post.createdAt, cursor.createdAt),
        and(
          eq(this.schema.post.createdAt, cursor.createdAt),
          lt(this.schema.post.id, cursor.postId)
        )
      );
      whereClause = and(whereClause, cursorCondition);
    }

    const results = await query
      .where(whereClause)
      .orderBy(desc(this.schema.post.createdAt), desc(this.schema.post.id))
      .limit(pageSize + 1);

    return results;
  }

  async updatePost(
    { postId, caption }: UpdatePostParams,
    tx: Database | Transaction = this.db,
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
    tx: Database | Transaction = this.db,
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
      columns: { authorId: true },
    });

    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId)
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
import { aliasedTable, and, desc, eq, lt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, Schema, Transaction } from "@oppfy/db";

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

  async getPost(
    { postId, userId }: GetPostParams,
    tx: Database | Transaction = this.db,
  ): Promise<Post | undefined> {
    const author = aliasedTable(this.schema.user, "author");
    const recipient = aliasedTable(this.schema.user, "recipient");
    const authorProfile = aliasedTable(this.schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(
      this.schema.profile,
      "recipientProfile",
    );

    const result = await tx
      .selectDistinct({
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
        hasLiked:
          sql<boolean>`CASE WHEN ${this.schema.like.userId} IS NOT NULL THEN true ELSE false END`.as(
            "has_liked",
          ),
      })
      .from(this.schema.post)
      .innerJoin(
        this.schema.postStats,
        eq(this.schema.postStats.postId, this.schema.post.id),
      )
      .innerJoin(author, eq(this.schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(authorProfile.userId, author.id))
      .innerJoin(recipient, eq(this.schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipientProfile.userId, recipient.id))
      .leftJoin(
        this.schema.like,
        and(
          eq(this.schema.like.postId, this.schema.post.id),
          eq(this.schema.like.userId, userId),
        ),
      )
      .where(eq(this.schema.post.id, postId))
      .limit(1);

    return result[0];
  }

  async getPostForNextJs(
    { postId }: GetPostForNextJsParams,
    tx: Database | Transaction = this.db,
  ): Promise<PostForNextJs | undefined> {
    const author = aliasedTable(this.schema.user, "author");
    const recipient = aliasedTable(this.schema.user, "recipient");
    const authorProfile = aliasedTable(this.schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(
      this.schema.profile,
      "recipientProfile",
    );

    const result = await tx
      .selectDistinct({
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
      })
      .from(this.schema.post)
      .innerJoin(
        this.schema.postStats,
        eq(this.schema.postStats.postId, this.schema.post.id),
      )
      .innerJoin(author, eq(this.schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(authorProfile.userId, author.id))
      .innerJoin(recipient, eq(this.schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipientProfile.userId, recipient.id))
      .where(eq(this.schema.post.id, postId))
      .limit(1);

    return result[0];
  }

  async paginatePostsOfFollowing(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: Database | Transaction = this.db,
  ): Promise<PaginatedPost[]> {
    const author = aliasedTable(this.schema.user, "author");
    const recipient = aliasedTable(this.schema.user, "recipient");
    const authorProfile = aliasedTable(this.schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(
      this.schema.profile,
      "recipientProfile",
    );

    return await tx
      .selectDistinct({
        postId: this.schema.post.id,
        authorId: this.schema.post.authorId,
        authorName: authorProfile.name,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: this.schema.post.recipientId,
        recipientName: recipientProfile.name,
        recipientUsername: recipientProfile.username,
        recipientProfileId: recipientProfile.id,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: this.schema.post.caption,
        imageUrl: this.schema.post.key,
        width: this.schema.post.width,
        height: this.schema.post.height,
        commentsCount: this.schema.postStats.comments,
        likesCount: this.schema.postStats.likes,
        mediaType: this.schema.post.mediaType,
        createdAt: this.schema.post.createdAt,
        hasLiked:
          sql<boolean>`CASE WHEN ${this.schema.like.userId} IS NOT NULL THEN true ELSE false END`.as(
            "has_liked",
          ),
      })
      .from(this.schema.post)
      .innerJoin(
        this.schema.postStats,
        eq(this.schema.postStats.postId, this.schema.post.id),
      )
      .innerJoin(author, eq(this.schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(authorProfile.userId, author.id))
      .innerJoin(recipient, eq(this.schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipientProfile.userId, recipient.id))
      .leftJoin(
        this.schema.like,
        and(
          eq(this.schema.like.postId, this.schema.post.id),
          eq(this.schema.like.userId, userId),
        ),
      )
      .leftJoin(
        this.schema.follow,
        and(
          eq(this.schema.follow.senderId, userId),
          eq(this.schema.follow.recipientId, this.schema.post.recipientId),
        ),
      )
      .where(
        and(
          or(
            // Posts where user follows the recipient
            eq(this.schema.follow.senderId, userId),
            // Posts authored by the user
            eq(this.schema.post.authorId, userId),
          ),
          cursor
            ? or(
                lt(this.schema.post.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.post.createdAt, cursor.createdAt),
                  lt(this.schema.post.id, cursor.postId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(this.schema.post.createdAt), desc(this.schema.post.id))
      .limit(pageSize + 1);
  }

  async paginatePostsOfUser(
    { userId, cursor, pageSize = 10 }: PaginatePostsParams,
    tx: Database | Transaction = this.db,
  ): Promise<PaginatedPost[]> {
    const author = aliasedTable(this.schema.user, "author");
    const recipient = aliasedTable(this.schema.user, "recipient");
    const authorProfile = aliasedTable(this.schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(
      this.schema.profile,
      "recipientProfile",
    );

    return await tx
      .select({
        postId: this.schema.post.id,
        authorId: this.schema.post.authorId,
        authorName: authorProfile.name,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: this.schema.post.recipientId,
        recipientProfileId: recipientProfile.id,
        recipientName: recipientProfile.name,
        recipientUsername: recipientProfile.username,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: this.schema.post.caption,
        imageUrl: this.schema.post.key,
        width: this.schema.post.width,
        height: this.schema.post.height,
        commentsCount: this.schema.postStats.comments,
        likesCount: this.schema.postStats.likes,
        mediaType: this.schema.post.mediaType,
        createdAt: this.schema.post.createdAt,
        hasLiked:
          sql<boolean>`CASE WHEN ${this.schema.like.userId} IS NOT NULL THEN true ELSE false END`.as(
            "has_liked",
          ),
      })
      .from(this.schema.post)
      .innerJoin(
        this.schema.postStats,
        eq(this.schema.postStats.postId, this.schema.post.id),
      )
      .innerJoin(author, eq(this.schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(authorProfile.userId, author.id))
      .innerJoin(recipient, eq(this.schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipientProfile.userId, recipient.id))
      .leftJoin(
        this.schema.like,
        and(
          eq(this.schema.like.postId, this.schema.post.id),
          eq(this.schema.like.userId, userId),
        ),
      )
      .where(
        and(
          eq(this.schema.post.recipientId, userId),
          cursor
            ? or(
                lt(this.schema.post.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.post.createdAt, cursor.createdAt),
                  lt(this.schema.post.id, cursor.postId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(this.schema.post.createdAt), desc(this.schema.post.id))
      .limit(pageSize + 1);
  }

  async updatePost(
    { postId, caption }: UpdatePostParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    await tx
      .update(this.schema.post)
      .set({ caption })
      .where(eq(this.schema.post.id, postId));
  }

  async createPostStats(
    { postId }: CreatePostStatsParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    await tx.insert(this.schema.postStats).values({ postId });
  }

  async deletePost(
    { userId, postId }: DeletePostParams,
    tx: Database | Transaction = this.db,
  ): Promise<void> {
    await tx.transaction(async (transaction) => {
      const post = await transaction.query.post.findFirst({
        where: eq(this.schema.post.id, postId),
        columns: { authorId: true, recipientId: true },
      });

      if (!post) throw new Error("Post not found");
      if (post.recipientId !== userId)
        throw new Error("Unauthorized: User does not own this post");

      await transaction
        .delete(this.schema.post)
        .where(eq(this.schema.post.id, postId));
      await transaction
        .update(this.schema.profileStats)
        .set({ posts: sql`${this.schema.profileStats.posts} - 1` })
        .where(
          eq(
            this.schema.profileStats.profileId,
            sql`(SELECT profile_id FROM "user" WHERE id = ${post.recipientId})`,
          ),
        );
    });
  }
}

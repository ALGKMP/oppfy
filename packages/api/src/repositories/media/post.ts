import { Dashboard } from "aws-cdk-lib/aws-cloudwatch";
import { aliasedTable, and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";

import { db, inArray, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";
import { ContactsRepository } from "../user/contacts";

export class PostRepository {
  private db = db;
  private contactsRepository = new ContactsRepository();

  @handleDatabaseErrors
  async getPost(postId: string, userId: string) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    const result = await this.db
      .selectDistinct({
        postId: schema.post.id,
        authorId: schema.post.authorId,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientProfileId: recipientProfile.id,
        recipientUsername: recipientProfile.username,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: schema.post.caption,
        imageUrl: schema.post.key,
        width: schema.post.width,
        height: schema.post.height,
        commentsCount: schema.postStats.comments,
        likesCount: schema.postStats.likes,
        mediaType: schema.post.mediaType,
        createdAt: schema.post.createdAt,
        hasLiked:
          sql<boolean>`CASE WHEN ${schema.like.userId} IS NOT NULL THEN true ELSE false END`.as(
            "has_liked",
          ),
      })
      .from(schema.post)
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
      .innerJoin(author, eq(schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .leftJoin(
        schema.like,
        and(
          eq(schema.like.postId, schema.post.id),
          eq(schema.like.userId, userId!),
        ),
      )
      .where(eq(schema.post.id, postId))
      .limit(1);

    return result[0];
  }

  async getPostForNextJs(postId: string) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    const result = await this.db
      .selectDistinct({
        postId: schema.post.id,
        authorId: schema.post.authorId,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientProfileId: recipientProfile.id,
        recipientUsername: recipientProfile.username,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: schema.post.caption,
        imageUrl: schema.post.key,
        width: schema.post.width,
        height: schema.post.height,
        commentsCount: schema.postStats.comments,
        likesCount: schema.postStats.likes,
        mediaType: schema.post.mediaType,
        createdAt: schema.post.createdAt,
      })
      .from(schema.post)
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
      .innerJoin(author, eq(schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .where(eq(schema.post.id, postId))
      .limit(1);

    return result[0];
  }

  @handleDatabaseErrors
  async getPostFromCommentId(commentId: string) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    const post = await this.db
      .selectDistinct({
        postId: schema.post.id,
        authorId: schema.post.authorId,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientProfileId: recipientProfile.id,
        recipientUsername: recipientProfile.username,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: schema.post.caption,
        imageUrl: schema.post.key,
        width: schema.post.width,
        height: schema.post.height,
        commentsCount: schema.postStats.comments,
        likesCount: schema.postStats.likes,
        mediaType: schema.post.mediaType,
        createdAt: schema.post.createdAt,
        hasLiked:
          sql<boolean>`CASE WHEN ${schema.like.userId} IS NOT NULL THEN true ELSE false END`.as(
            "has_liked",
          ),
      })
      .from(schema.comment)
      .innerJoin(schema.post, eq(schema.comment.postId, schema.post.id))
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
      .innerJoin(schema.like, eq(schema.like.postId, schema.post.id))
      .innerJoin(author, eq(schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .where(eq(schema.comment.id, commentId))
      .limit(1);

    return post[0];
  }

  @handleDatabaseErrors
  async paginatePostsOfFollowing(
    userId: string,
    cursor: { createdAt: Date; postId: string } | null = null,
    pageSize: number,
  ) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    return await this.db
      .selectDistinct({
        postId: schema.post.id,
        authorId: schema.post.authorId,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientUsername: recipientProfile.username,
        recipientProfileId: recipientProfile.id,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: schema.post.caption,
        imageUrl: schema.post.key,
        width: schema.post.width,
        height: schema.post.height,
        commentsCount: schema.postStats.comments,
        likesCount: schema.postStats.likes,
        mediaType: schema.post.mediaType,
        createdAt: schema.post.createdAt,
        hasLiked:
          sql<boolean>`CASE WHEN ${schema.like.userId} IS NOT NULL THEN true ELSE false END`.as(
            "has_liked",
          ),
      })
      .from(schema.follower)
      .innerJoin(
        schema.post,
        eq(schema.post.recipientId, schema.follower.recipientId),
      )
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
      .innerJoin(schema.like, eq(schema.like.postId, schema.post.id))
      .innerJoin(author, eq(schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .where(
        and(
          eq(schema.follower.senderId, userId),
          cursor
            ? or(
                lt(schema.post.createdAt, cursor.createdAt),
                and(
                  eq(schema.post.createdAt, cursor.createdAt),
                  lt(schema.post.id, cursor.postId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(schema.post.createdAt), desc(schema.post.id))
      .limit(pageSize + 1);
  }

  @handleDatabaseErrors
  async paginatePostsOfRecommended(
    userId: string,
    cursor: { createdAt: Date; postId: string } | null = null,
    pageSize: number,
  ) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    // get recc ids
    const recommendedUserIds = await this.contactsRepository
      .getRecommendationsInternal(userId)
      .then((res) => {
        return [...res.tier1, ...res.tier2, ...res.tier3];
      });

    // TODO: if recs is empty just return top posts
    if (recommendedUserIds.length === 0) {
      return [];
    }

    // get one post from each recommended user
    const latestPosts = this.db
      .select({
        postId: sql<number>`max(${schema.post.id})`.as("latest_post_id"),
        authorId: schema.post.authorId,
      })
      .from(schema.post)
      .where(inArray(schema.post.authorId, recommendedUserIds))
      .groupBy(schema.post.authorId)
      .as("latest_posts");

    return await this.db
      .select({
        postId: schema.post.id,
        authorId: schema.post.authorId,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientUsername: recipientProfile.username,
        recipientProfileId: recipientProfile.id,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: schema.post.caption,
        imageUrl: schema.post.key,
        width: schema.post.width,
        height: schema.post.height,
        commentsCount: schema.postStats.comments,
        likesCount: schema.postStats.likes,
        mediaType: schema.post.mediaType,
        createdAt: schema.post.createdAt,
        hasLiked:
          sql<boolean>`CASE WHEN ${schema.like.userId} IS NOT NULL THEN true ELSE false END`.as(
            "has_liked",
          ),
      })
      .from(latestPosts)
      .innerJoin(schema.post, eq(schema.post.id, latestPosts.postId))
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
      .innerJoin(author, eq(schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .leftJoin(
        schema.like,
        and(
          eq(schema.like.postId, schema.post.id),
          eq(schema.like.userId, userId),
        ),
      )
      .where(
        cursor
          ? or(
              lt(schema.post.createdAt, cursor.createdAt),
              and(
                eq(schema.post.createdAt, cursor.createdAt),
                gt(schema.post.id, cursor.postId),
              ),
            )
          : undefined,
      )
      .orderBy(desc(schema.post.createdAt), desc(schema.post.id))
      .limit(pageSize + 1);
  }

  @handleDatabaseErrors
  async paginatePostsOfUser(
    userId: string,
    cursor: { createdAt: Date; postId: string } | null = null,
    pageSize: number,
  ) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    return await this.db
      .select({
        postId: schema.post.id,
        authorId: schema.post.authorId,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientProfileId: recipientProfile.id,
        recipientUsername: recipientProfile.username,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: schema.post.caption,
        imageUrl: schema.post.key,
        width: schema.post.width,
        height: schema.post.height,
        commentsCount: schema.postStats.comments,
        likesCount: schema.postStats.likes,
        mediaType: schema.post.mediaType,
        createdAt: schema.post.createdAt,
        hasLiked:
          sql<boolean>`CASE WHEN ${schema.like.userId} IS NOT NULL THEN true ELSE false END`.as(
            "has_liked",
          ),
      })
      .from(schema.post)
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
      .innerJoin(author, eq(schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .leftJoin(
        schema.like,
        and(
          eq(schema.like.postId, schema.post.id),
          eq(schema.like.userId, userId),
        ),
      )
      .where(
        and(
          eq(schema.post.recipientId, userId),
          cursor
            ? or(
                lt(schema.post.createdAt, cursor.createdAt),
                and(
                  eq(schema.post.createdAt, cursor.createdAt),
                  lt(schema.post.id, cursor.postId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(schema.post.createdAt), desc(schema.post.id))
      .limit(pageSize + 1);
  }

  @handleDatabaseErrors
  async paginatePostsByUser(
    userId: string,
    cursor: { createdAt: Date; postId: string } | null = null,
    pageSize: number,
  ) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    return await this.db
      .select({
        postId: schema.post.id,
        authorId: schema.post.authorId,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientUsername: recipientProfile.username,
        recipientProfileId: recipientProfile.id,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: schema.post.caption,
        imageUrl: schema.post.key,
        width: schema.post.width,
        height: schema.post.height,
        commentsCount: schema.postStats.comments,
        likesCount: schema.postStats.likes,
        mediaType: schema.post.mediaType,
        createdAt: schema.post.createdAt,
        hasLiked:
          sql<boolean>`CASE WHEN ${schema.like.userId} IS NOT NULL THEN true ELSE false END`.as(
            "has_liked",
          ),
      })
      .from(schema.post)
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
      .innerJoin(author, eq(schema.post.authorId, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipientId, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .leftJoin(schema.like, eq(schema.like.postId, schema.post.id))
      .where(
        and(
          eq(schema.post.authorId, userId),
          cursor
            ? or(
                gt(schema.post.createdAt, cursor.createdAt),
                and(
                  eq(schema.post.createdAt, cursor.createdAt),
                  gt(schema.post.id, cursor.postId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(schema.post.createdAt), // Primary order by the creation date
        asc(schema.post.id), // Tiebreaker order by post ID
      )
      .limit(pageSize + 1); // Fetch an extra item to check if there's a next page
  }

  @handleDatabaseErrors
  async updatePost({ postId, caption }: { postId: string; caption: string }) {
    await this.db
      .update(schema.post)
      .set({ caption })
      .where(eq(schema.post.id, postId));
  }

  @handleDatabaseErrors
  async createPostStats(postId: string) {
    return await this.db.insert(schema.postStats).values({ postId });
  }

  @handleDatabaseErrors
  async deletePost(postId: string) {
    await this.db.delete(schema.post).where(eq(schema.post.id, postId));
  }

  @handleDatabaseErrors
  async getCountOfPostsNotOnApp(userId: string) {
    return await this.db
      .select({
        count: sql<number>`count(*)`.as("count"),
      })
      .from(schema.postOfUserNotOnApp)
      .where(eq(schema.post.authorId, userId))
      .limit(1);
  }
}

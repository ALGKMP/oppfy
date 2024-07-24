import { aliasedTable, and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";

import { db, inArray, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";
import { ContactsRepository } from "../user/contacts";

export class PostRepository {
  private db = db;
  private contactsRepository = new ContactsRepository();

  @handleDatabaseErrors
  async getPost(postId: number) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    return await this.db
      .selectDistinct({
        postId: schema.post.id,
        authorId: schema.post.author,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipient,
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
      .innerJoin(author, eq(schema.post.author, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipient, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .where(eq(schema.post.id, postId))
      .limit(1);
  }

  @handleDatabaseErrors
  async paginatePostsOfFollowing(
    userId: string,
    cursor: { createdAt: Date; followerId: number } | null = null,
    pageSize = 10,
  ) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");
    const follower = aliasedTable(schema.follower, "follower");

    console.log("in here");

    // Subquery to get the latest post for each followed user
    const latestPosts = this.db
      .select({
        postId: sql<number>`max(${schema.post.id})`.as("latest_post_id"),
        authorId: schema.post.author,
        followerId: follower.id,
      })
      .from(schema.post)
      .innerJoin(follower, eq(follower.recipientId, schema.post.recipient))
      .where(eq(follower.senderId, userId))
      .groupBy(schema.post.author, follower.id)
      .as("latest_posts");

    return await this.db
      .select({
        postId: schema.post.id,
        authorId: schema.post.author,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipient,
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
        followerId: latestPosts.followerId,
      })
      .from(latestPosts)
      .innerJoin(schema.post, eq(schema.post.id, latestPosts.postId))
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
      .innerJoin(author, eq(schema.post.author, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipient, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .where(
        cursor
          ? or(
              lt(schema.post.createdAt, cursor.createdAt),
              and(
                eq(schema.post.createdAt, cursor.createdAt),
                gt(latestPosts.followerId, cursor.followerId),
              ),
            )
          : undefined,
      )
      .orderBy(desc(schema.post.createdAt), asc(latestPosts.followerId))
      .limit(pageSize + 1);
  }

  @handleDatabaseErrors
  async paginatePostsOfRecommended(
    userId: string,
    cursor: { createdAt: Date; postId: number } | null = null,
    pageSize = 10,
  ) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    // get recc ids
    const reccomendedUserIds = await this.contactsRepository
      .getRecommendationsInternal(userId)
      .then((res) => {
        return [...res.tier1, ...res.tier2, ...res.tier3];
      });

    // TODO: if recs is empty just return top posts
    if (reccomendedUserIds.length === 0) {
      return [];
    }

    // get one post from each rec id
    const latestPosts = this.db
      .select({
        postId: sql<number>`max(${schema.post.id})`.as("latest_post_id"),
        authorId: schema.post.author,
        followerId: schema.follower.id,
      })
      .from(schema.post)
      .innerJoin(
        schema.follower,
        eq(schema.follower.recipientId, schema.post.recipient),
      )
      .where(inArray(schema.post.recipient, reccomendedUserIds))
      .groupBy(schema.post.author, schema.follower.id)
      .as("latest_posts");

    return await this.db
      .select({
        postId: schema.post.id,
        authorId: schema.post.author,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipient,
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
        followerId: latestPosts.followerId,
      })
      .from(latestPosts)
      .innerJoin(schema.post, eq(schema.post.id, latestPosts.postId))
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
      .innerJoin(author, eq(schema.post.author, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipient, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .where(
        cursor
          ? or(
              lt(schema.post.createdAt, cursor.createdAt),
              and(
                eq(schema.post.createdAt, cursor.createdAt),
                gt(latestPosts.postId, cursor.postId),
              ),
            )
          : undefined,
      )
      .orderBy(desc(schema.post.createdAt), asc(latestPosts.followerId))
      .limit(pageSize + 1);
  }

  @handleDatabaseErrors
  async paginatePostsOfUser(
    userId: string,
    cursor: { createdAt: Date; postId: number } | null = null,
    pageSize = 10,
  ) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    return await this.db
      .select({
        postId: schema.post.id,
        authorId: schema.post.author,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipient,
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
      .innerJoin(author, eq(schema.post.author, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipient, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .where(
        and(
          eq(schema.post.recipient, userId),
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
    cursor: { createdAt: Date; postId: number } | null = null,
    pageSize = 10,
  ) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");

    return await this.db
      .select({
        postId: schema.post.id,
        authorId: schema.post.author,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipient,
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
      })
      .from(schema.post)
      .innerJoin(schema.postStats, eq(schema.post.id, schema.postStats.postId))
      .innerJoin(author, eq(schema.post.author, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipient, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .where(
        and(
          eq(schema.post.author, userId),
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
  async updatePost(postId: number, newCaption: string) {
    await this.db
      .update(schema.post)
      .set({ caption: newCaption })
      .where(eq(schema.post.id, postId));
  }

  @handleDatabaseErrors
  async createPostStats(postId: number) {
    return await this.db.insert(schema.postStats).values({ postId });
  }

  @handleDatabaseErrors
  async deletePost(postId: number) {
    await this.db.delete(schema.post).where(eq(schema.post.id, postId));
  }
}

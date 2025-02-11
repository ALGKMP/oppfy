import { aliasedTable, and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";

import { cloudfront } from "@oppfy/cloudfront";
import { db, inArray, schema } from "@oppfy/db";
import { env } from "@oppfy/env";
import { mux } from "@oppfy/mux";
import { s3 } from "@oppfy/s3";

import {
  handleAwsErrors,
  handleDatabaseErrors,
  handleMuxErrors,
} from "../../errors";
import { DomainError, ErrorCode } from "../../errors";
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
        authorName: authorProfile.name,
        recipientId: schema.post.recipientId,
        recipientProfileId: recipientProfile.id,
        recipientUsername: recipientProfile.username,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        recipientName: recipientProfile.name,
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
        authorName: authorProfile.name,
        recipientId: schema.post.recipientId,
        recipientProfileId: recipientProfile.id,
        recipientUsername: recipientProfile.username,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        recipientName: recipientProfile.name,
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
        authorName: authorProfile.name,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientProfileId: recipientProfile.id,
        recipientName: recipientProfile.name,
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
      .from(schema.comment)
      .innerJoin(schema.post, eq(schema.comment.postId, schema.post.id))
      .innerJoin(schema.postStats, eq(schema.postStats.postId, schema.post.id))
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
        authorName: authorProfile.name,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientName: recipientProfile.name,
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
      .leftJoin(
        schema.like,
        and(
          eq(schema.like.postId, schema.post.id),
          eq(schema.like.userId, userId),
        ),
      )
      .leftJoin(
        schema.follower,
        and(
          eq(schema.follower.senderId, userId),
          eq(schema.follower.recipientId, schema.post.recipientId),
        ),
      )
      .where(
        and(
          or(
            // Posts where user follows the recipient
            eq(schema.follower.senderId, userId),
            // Posts authored by the user
            eq(schema.post.authorId, userId),
          ),
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
        authorName: authorProfile.name,
        recipientId: schema.post.recipientId,
        recipientUsername: recipientProfile.username,
        recipientProfileId: recipientProfile.id,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        recipientName: recipientProfile.name,
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
        authorName: authorProfile.name,
        authorUsername: authorProfile.username,
        authorProfileId: authorProfile.id,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipientId,
        recipientProfileId: recipientProfile.id,
        recipientName: recipientProfile.name,
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
        authorName: authorProfile.name,
        recipientId: schema.post.recipientId,
        recipientUsername: recipientProfile.username,
        recipientProfileId: recipientProfile.id,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        recipientName: recipientProfile.name,
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
  async deletePost({ userId, postId }: { userId: string; postId: string }) {
    await this.db.transaction(async (tx) => {
      // Get the post and verify ownership before deleting
      const post = await tx.query.post.findFirst({
        where: eq(schema.post.id, postId),
        columns: { authorId: true, recipientId: true },
      });

      if (!post) {
        throw new Error("Post not found");
      }

      // Verify ownership
      if (post.recipientId !== userId) {
        throw new Error("Unauthorized: User does not own this post");
      }

      // Delete the post
      await tx.delete(schema.post).where(eq(schema.post.id, postId));

      // Decrement author's profile stats post count
      await tx
        .update(schema.profileStats)
        .set({ posts: sql`${schema.profileStats.posts} - 1` })
        .where(
          eq(
            schema.profileStats.profileId,
            sql`(SELECT profile_id FROM "user" WHERE id = ${post.recipientId})`,
          ),
        );
    });
  }

  @handleMuxErrors
  async PresignedUrlWithPostMetadata({
    author,
    recipient,
    caption,
    height,
    width,
    postid,
  }: {
    author: string;
    recipient: string;
    caption: string;
    height: string;
    width: string;
    postid: string;
  }) {
    return await mux.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        test: false,
        encoding_tier: "smart",
        mp4_support: "standard",
        playback_policy: ["public"],
        passthrough: JSON.stringify({
          author,
          recipient,
          caption,
          height,
          width,
          postid,
        }),
      },
    });
  }

  @handleAwsErrors
  async getSignedPublicPostUrl(objectKey: string) {
    const url = cloudfront.getPublicPostUrl(objectKey);
    return await cloudfront.getSignedUrl({ url });
  }

  @handleAwsErrors
  async getSignedPrivatePostUrl(objectKey: string) {
    const url = cloudfront.getPrivatePostUrl(objectKey);
    return await cloudfront.getSignedUrl({ url });
  }

  @handleAwsErrors
  async invalidateUserPosts(userId: string) {
    const distributionId = env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_ID;
    const objectPattern = `/posts/*-${userId}-*.jpg`;
    await cloudfront.createInvalidation(distributionId, objectPattern);
  }

  async uploadPostUrl({
    author,
    recipient,
    caption,
    height,
    width,
    contentLength,
    contentType,
    postId,
    isRecipientOnApp,
  }: {
    author: string;
    recipient: string;
    caption: string;
    height: string;
    width: string;
    contentLength: number;
    contentType: "image/jpeg" | "image/png" | "image/heic";
    postId: string;
    isRecipientOnApp: boolean;
  }) {
    try {
      const currentDate = Date.now();
      const objectKey = `posts/${currentDate}-${recipient}-${author}.jpg`;

      caption = encodeURIComponent(caption);

      const presignedUrl = await s3.putObjectPresignedUrl({
        Bucket: env.S3_POST_BUCKET,
        Key: objectKey,
        ContentLength: contentLength,
        ContentType: contentType,
        Metadata: {
          author,
          recipient,
          caption,
          height,
          width,
          postid: postId,
          ...(isRecipientOnApp ? {} : { recipientNotOnApp: "true" }),
        },
      });

      return presignedUrl;
    } catch (err) {
      throw new DomainError(
        ErrorCode.S3_FAILED_TO_UPLOAD,
        "S3 failed while trying to upload post",
      );
    }
  }
}

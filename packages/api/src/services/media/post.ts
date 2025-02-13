import type { z } from "zod";

import { cloudfront } from "@oppfy/cloudfront";
import { env } from "@oppfy/env";
import { mux } from "@oppfy/mux";
import { s3 } from "@oppfy/s3";
import { sns } from "@oppfy/sns";
import type { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import {
  ProfileRepository,
  UserRepository,
  ViewRepository,
} from "../../repositories";
import { CommentRepository } from "../../repositories/media/comment";
import { LikeRepository } from "../../repositories/media/like";
import { PostRepository } from "../../repositories/media/post";
import { PostStatsRepository } from "../../repositories/media/post-stats";
import { NotificationsRepository } from "../../repositories/user/notifications";
import { UserService } from "../user/user";
import { randomUUID } from "crypto";

interface BaseCursor {
  createdAt: Date;
}

export interface PaginatedResponse<TItem, TCursor extends BaseCursor> {
  items: TItem[];
  nextCursor: TCursor | undefined;
}

interface PostCursor extends BaseCursor {
  postId: string;
}

interface FeedCursor extends BaseCursor {
  postId: string;
  type: "following" | "recommended";
}

interface CommentCursor extends BaseCursor {
  commentId: string;
}

type CommentProfile = z.infer<typeof sharedValidators.media.comment>;

type Post = z.infer<typeof sharedValidators.media.post>;

export class PostService {
  private likeRepository = new LikeRepository();
  private commentRepository = new CommentRepository();
  private postRepository = new PostRepository();
  private postStatsRepository = new PostStatsRepository();
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private viewRepository = new ViewRepository();
  private notificationsRepository = new NotificationsRepository();

  private userService = new UserService();

   // Post for user on app
   async uploadPostForUserOnAppUrl({
    author,
    recipient,
    caption,
    height,
    width,
    contentLength,
    contentType,
  }: {
    author: string;
    recipient: string;
    caption: string;
    height: string;
    width: string;
    contentLength: number;
    contentType: "image/jpeg" | "image/png" | "image/heic";
  }) {
    try {
      const currentDate = Date.now();
      const objectKey = `posts/${currentDate}-${recipient}-${author}.jpg`;
      const postId = randomUUID();

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

  // post for user not on app
  async uploadPostForUserNotOnAppUrl({
    author,
    recipientNotOnAppPhoneNumber,
    recipientNotOnAppName,
    caption,
    height,
    width,
    contentLength,
    contentType,
  }: {
    author: string;
    recipientNotOnAppPhoneNumber: string;
    recipientNotOnAppName: string;
    caption: string;
    height: string;
    width: string;
    contentLength: number;
    contentType: "image/jpeg" | "image/png" | "image/heic";
  }) {
    try {

      const recipient = await this.userRepository.getUserByPhoneNumber(recipientNotOnAppPhoneNumber);
      const recipientId = recipient ? recipient.id : randomUUID();

      if (!recipient) {
        await this.userService.createUserWithUsername(
          recipientId,
          recipientNotOnAppPhoneNumber,
          recipientNotOnAppName,
        );
      }

      const currentDate = Date.now();
      const objectKey = `posts/${currentDate}-${recipientId}-${author}.jpg`;
      const postId = randomUUID();

      caption = encodeURIComponent(caption);

      const presignedUrl = await s3.putObjectPresignedUrl({
        Bucket: env.S3_POST_BUCKET,
        Key: objectKey,
        ContentLength: contentLength,
        ContentType: contentType,
        Metadata: {
          author,
          caption,
          height,
          width,
          recipient: recipientId,
          postid: postId,
        },
      });

      return { presignedUrl, postId };
    } catch (err) {
      throw new DomainError(
        ErrorCode.S3_FAILED_TO_UPLOAD,
        "S3 failed while trying to upload post",
      );
    }
  }


  async paginatePostsOfUserSelf(
    userId: string,
    cursor: PostCursor | null = null,
    pageSize: number,
  ): Promise<PaginatedResponse<Post, PostCursor>> {
    try {
      const data = await this.postRepository.paginatePostsOfUser(
        userId,
        cursor,
        pageSize,
      );
      const updatedData = await this._processPaginatedPostData(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(`Error in getPosts for userId: ${userId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_POSTS,
        "Failed to paginate posts.",
      );
    }
  }

  async paginatePostsOfUserOther({
    userId,
    cursor,
    pageSize,
    currentUserId,
  }: {
    userId: string;
    cursor: PostCursor | null;
    pageSize: number;
    currentUserId: string;
  }): Promise<PaginatedResponse<Post, PostCursor>> {
    try {
      const canAccess = await this.userService.canAccessUserData({
        currentUserId,
        targetUserId: userId,
      });
      if (!canAccess) {
        return {
          items: [],
          nextCursor: undefined,
        };
      }

      const data = await this.postRepository.paginatePostsOfUser(
        userId,
        cursor,
        pageSize,
      );
      const updatedData = await this._processPaginatedPostData(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(`Error in getPosts for profile: ${userId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_POSTS,
        "Failed to paginate posts.",
      );
    }
  }

  async paginatePostsOfRecommended(
    userId: string,
    cursor: PostCursor | null = null,
    pageSize: number,
  ) {
    try {
      const data = await this.postRepository.paginatePostsOfRecommended(
        userId,
        cursor,
        pageSize,
      );
      const updatedData = await this._processPaginatedPostData(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(`Error in getPosts for userId: ${userId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_POSTS,
        "Failed to paginate posts.",
      );
    }
  }

  async paginatePostsForFeed(
    userId: string,
    cursor: FeedCursor | null = null,
    pageSize: number,
  ): Promise<PaginatedResponse<Post, FeedCursor>> {
    const followingResult = await this.postRepository.paginatePostsOfFollowing(
      userId,
      cursor,
      pageSize,
    );

    const parsedFollowingResult = await this._processPaginatedPostDataForFeed(
      followingResult,
      pageSize,
    );

    return parsedFollowingResult;

    // if (cursor?.type === "recommended") {
    //   console.log("Recommended cursor");
    //   const recommendedResult =
    //     await this.postRepository.paginatePostsOfRecommended(
    //       userId,
    //       cursor.cursor,
    //       pageSize,
    //     );

    //   const parsedRecommendedResult = this._processPaginatedPostData(
    //     recommendedResult,
    //     pageSize,
    //   );

    //   // spread
    //   const { nextCursor, ...rest } = parsedRecommendedResult;
    //   console.log("Next cursor", nextCursor);
    //   console.log("Rest", rest);

    //   if (nextCursor === undefined) {
    //     return {
    //       ...rest,
    //       nextCursor: undefined,
    //     };
    //   }

    //   return {
    //     ...rest,
    //     nextCursor: {
    //       type: "recommended",
    //       cursor: nextCursor,
    //     },
    //   };
    // }

    //   if (nextCursor === undefined) {
    //     return {
    //       ...rest,
    //       nextCursor: undefined,
    //     };
    //   }

    //   return {
    //     ...rest,
    //     nextCursor: {
    //       type: "recommended",
    //       cursor: nextCursor,
    //     },
    //   };
    // }

    // return parsedFollowingResult;
  }

  async getPost(postId: string, userId: string): Promise<Post> {
    try {
      const post = await this.postRepository.getPost(postId, userId);
      if (!post) {
        throw new DomainError(
          ErrorCode.FAILED_TO_GET_POST,
          "Failed to get post.",
        );
      }
      const processedPost = await this._processPostData(post);
      return processedPost;
    } catch (error) {
      console.error(`Error in getPost for postId: ${postId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_POST,
        "Failed to get post.",
      );
    }
  }

  async editPost({ postId, caption }: { postId: string; caption: string }) {
    try {
      await this.postRepository.updatePost({ postId, caption });
    } catch (error) {
      console.error(`Error in editPost for postId: ${postId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_EDIT_POST,
        "Failed to edit post.",
      );
    }
  }

  async deletePost({ postId, userId }: { postId: string; userId: string }) {
    try {
      await this.postRepository.deletePost({ postId, userId });

      // if (post.mediaType === "video") {
      //   await this.muxRepository.deleteAsset(post.imageUrl);
      // } else {
      //   await this.s3Repository.deleteObject(env.S3_POST_BUCKET, post.imageUrl);
      // }
    } catch (error: unknown) {
      console.error(`Error in deletePost for postId: ${postId}: `, error);

      if (error instanceof Error) {
        if (error.message.includes("Unauthorized")) {
          throw new DomainError(
            ErrorCode.UNAUTHORIZED,
            "You are not authorized to delete this post.",
          );
        }

        if (error.message.includes("not found")) {
          throw new DomainError(ErrorCode.POST_NOT_FOUND, "Post not found.");
        }
      }

      throw new DomainError(
        ErrorCode.FAILED_TO_DELETE_POST,
        "Failed to delete post.",
      );
    }
  }

  async likePost({ userId, postId }: { userId: string; postId: string }) {
    try {
      const like = await this.likeRepository.findLike({ postId, userId });
      if (like) {
        throw new DomainError(
          ErrorCode.FAILED_TO_LIKE_POST,
          "Tried to like a post that was already liked.",
        );
      }
      await this.likeRepository.addLike(postId, userId);
      await this.postStatsRepository.incrementLikesCount(postId);

      const post = await this.getPost(postId, userId);

      // Only store and send notification if the liker is not the post owner
      if (userId !== post.recipientId) {
        const recentNotifications =
          await this.notificationsRepository.getRecentNotifications({
            senderId: userId,
            recipientId: post.recipientId,
            eventType: "like",
            entityId: postId,
            entityType: "post",
            minutesThreshold: 10,
            limit: 1,
          });

        if (recentNotifications.length === 0) {
          await this.notificationsRepository.storeNotification(
            userId,
            post.recipientId,
            {
              eventType: "like",
              entityId: postId.toString(),
              entityType: "post",
            },
          );

          const settings =
            await this.notificationsRepository.getNotificationSettings(
              post.recipientId,
            );

          if (settings?.likes) {
            const user = await this.profileRepository.getUserProfile(userId);

            if (user === undefined) {
              throw new DomainError(ErrorCode.USER_NOT_FOUND);
            }

            const { profile } = user;
            const pushTokens = await this.notificationsRepository.getPushTokens(
              post.recipientId,
            );

            await sns.sendLikeNotification(
              pushTokens,
              userId,
              post.recipientId,
              profile.username,
              postId,
            );
          }
        }
      }
    } catch (error) {
      console.error(
        `Error in likePost for userId: ${userId}, postId: ${postId}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_LIKE_POST,
        "Failed to like post.",
      );
    }
  }
  async unlikePost({ userId, postId }: { userId: string; postId: string }) {
    try {
      const like = await this.likeRepository.findLike({ postId, userId });
      if (!like) {
        throw new DomainError(
          ErrorCode.FAILED_TO_UNLIKE_POST,
          "Tried to unlike a post that was not liked.",
        );
      }
      await this.likeRepository.removeLike({ postId, userId });
      await this.postStatsRepository.decrementLikesCount(postId);
    } catch (error) {
      console.error(
        `Error in unlikePost for userId: ${userId}, postId: ${postId}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_UNLIKE_POST,
        "Failed to unlike post.",
      );
    }
  }

  async getLike({ userId, postId }: { userId: string; postId: string }) {
    try {
      return await this.likeRepository.findLike({ postId, userId });
    } catch (error) {
      console.error(
        `Error in hasLiked for userId: ${userId}, postId: ${postId}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_CHECK_LIKE,
        "Failed to check if user has liked post.",
      );
    }
  }

  async commentOnPost({
    userId,
    postId,
    body,
  }: {
    userId: string;
    postId: string;
    body: string;
  }) {
    await this.commentRepository.addComment({ postId, userId, body });
    await this.postStatsRepository.incrementCommentsCount(postId);

    const post = await this.getPost(postId, userId);

    // Only store and send notification if the commenter is not the post owner
    if (userId !== post.recipientId) {
      const recentNotifications =
        await this.notificationsRepository.getRecentNotifications({
          senderId: userId,
          recipientId: post.recipientId,
          eventType: "comment",
          entityId: postId,
          entityType: "post",
          minutesThreshold: 10,
          limit: 1,
        });

      if (recentNotifications.length === 0) {
        await this.notificationsRepository.storeNotification(
          userId,
          post.recipientId,
          {
            eventType: "comment",
            entityId: postId.toString(),
            entityType: "post",
          },
        );

        const settings =
          await this.notificationsRepository.getNotificationSettings(
            post.recipientId,
          );

        if (settings?.comments) {
          const user = await this.profileRepository.getUserProfile(userId);

          if (user === undefined) {
            throw new DomainError(ErrorCode.USER_NOT_FOUND);
          }

          const { profile } = user;
          const pushTokens = await this.notificationsRepository.getPushTokens(
            post.recipientId,
          );

          await sns.sendCommentNotification(
            pushTokens,
            userId,
            post.recipientId,
            profile.username,
            postId,
          );
        }
      }
    }
  }

  async deleteComment({
    userId,
    commentId,
    postId,
  }: {
    userId: string;
    commentId: string;
    postId: string;
  }) {
    // get post data from commentId
    const post = await this.postRepository.getPostFromCommentId(commentId);
    console.log("post", post);

    if (post === undefined) {
      throw new DomainError(ErrorCode.POST_NOT_FOUND);
    }
    console.log("post", post);

    const comment = await this.commentRepository.getComment(commentId);
    console.log("comment", comment);

    if (comment === undefined) {
      throw new DomainError(ErrorCode.COMMENT_NOT_FOUND);
    }
    console.log("comment", comment);

    if (post.recipientId !== userId && comment.userId !== userId) {
      throw new DomainError(ErrorCode.UNAUTHORIZED);
    }
    console.log("comment", comment);

    await this.commentRepository.removeComment(commentId);
    console.log("comment", comment);
    await this.postStatsRepository.decrementCommentsCount(postId);
  }

  async paginateComments(
    postId: string,
    cursor: CommentCursor | null = null,
    pageSize: number,
  ): Promise<PaginatedResponse<CommentProfile, CommentCursor>> {
    try {
      const data = await this.commentRepository.paginateComments(
        postId,
        cursor,
        pageSize,
      );
      const updatedData = await this._updateProfilePictureUrls2(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(
        `Error in getPaginatedComments for postId: ${postId}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_COMMENTS,
        `Failed to paginate comments for postId: ${postId}.`,
      );
    }
  }

  async viewPost({ userId, postId }: { userId: string; postId: string }) {
    try {
      await this.viewRepository.viewPost({ userId, postId });
    } catch (error) {
      console.error(
        `Error in viewPost for userId: ${userId}, postId: ${postId}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_CREATE_VIEW,
        "Failed to create post view.",
      );
    }
  }

  async viewMultiplePosts({
    userId,
    postIds,
  }: {
    userId: string;
    postIds: string[];
  }) {
    try {
      await this.viewRepository.viewMultiplePosts({ userId, postIds });
    } catch (error) {
      console.error(
        `Error in viewMultiplePosts for userId: ${userId}, postIds: ${postIds}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_CREATE_VIEW,
        "Failed to create post view.",
      );
    }
  }

  async getPostForNextJs(postId: string): Promise<Omit<Post, "hasLiked">> {
    try {
      const post = await this.postRepository.getPostForNextJs(postId);
      if (!post) {
        throw new DomainError(
          ErrorCode.FAILED_TO_GET_POST,
          "Failed to get post.",
        );
      }

      const user = await this.userRepository.getUser(post.authorId);
      if (!user) {
        throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      if (user.privacySetting !== "public") {
        throw new DomainError(ErrorCode.UNAUTHORIZED, "This post is private");
      }

      const processedPost = await this._processPostDataForNextJs(post);
      return processedPost;
    } catch (error) {
      console.error(`Error in getPostForNextJs for postId: ${postId}: `, error);
      throw error;
    }
  }

  async getPresignedUrlForVideo({
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

  async invalidateUserPosts(userId: string): Promise<void> {
    await cloudfront.invalidateUserPosts(userId);
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
  }): Promise<string> {
    try {
      const currentDate = Date.now();
      const objectKey = `posts/${currentDate}-${recipient}-${author}.jpg`;
      caption = encodeURIComponent(caption);

      return await s3.uploadPost({
        bucket: env.S3_POST_BUCKET,
        objectKey,
        contentLength,
        contentType,
        metadata: {
          author,
          recipient,
          caption,
          height,
          width,
          postid: postId,
          ...(isRecipientOnApp ? {} : { recipientNotOnApp: "true" }),
        },
      });
    } catch (err) {
      throw new DomainError(
        ErrorCode.S3_FAILED_TO_UPLOAD,
        "S3 failed while trying to upload post",
      );
    }
  }

  private async _processPostData(data: Post): Promise<Post> {
    try {
      // Update author profile picture URL
      if (data.authorProfilePicture !== null) {
        data.authorProfilePicture = await this._getSignedPostUrl(
          data.authorProfilePicture,
        );
      }

      if (data.recipientProfilePicture !== null) {
        data.recipientProfilePicture = await this._getSignedPostUrl(
          data.recipientProfilePicture,
        );
      }

      if (data.mediaType === "image") {
        const imageUrl = await this._getSignedPostUrl(data.imageUrl);
        data.imageUrl = imageUrl;
      } else {
        data.imageUrl = `https://stream.mux.com/${data.imageUrl}.m3u8`;
      }
    } catch (error) {
      console.error(
        `Error updating profile picture URLs for postId: ${data.postId}, authorId: ${data.authorId}, recipientId: ${data.recipientId}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URL.",
      );
    }
    return data;
  }

  private async _processPostDataForNextJs(
    data: Omit<Post, "hasLiked">,
  ): Promise<Omit<Post, "hasLiked">> {
    try {
      // Update author profile picture URL
      if (data.authorProfilePicture !== null) {
        data.authorProfilePicture = await this._getSignedPostUrl(
          data.authorProfilePicture,
        );
      }

      if (data.recipientProfilePicture !== null) {
        data.recipientProfilePicture = await this._getSignedPostUrl(
          data.recipientProfilePicture,
        );
      }

      if (data.mediaType === "image") {
        const imageUrl = await this._getSignedPublicPostUrl(data.imageUrl);
        data.imageUrl = imageUrl;
      } else {
        data.imageUrl = `https://image.mux.com/${data.imageUrl}/thumbnail.jpg`;
      }
    } catch (error) {
      console.error(
        `Error updating profile picture URLs for postId: ${data.postId}, authorId: ${data.authorId}, recipientId: ${data.recipientId}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URL.",
      );
    }
    return data;
  }

  private async _processPaginatedPostData(
    data: Post[],
    pageSize: number,
  ): Promise<PaginatedResponse<Post, PostCursor>> {
    const items = data.map(async (item) => {
      try {
        if (item.authorProfilePicture !== null) {
          item.authorProfilePicture = await this._getSignedPostUrl(
            item.authorProfilePicture,
          );
        }

        if (item.recipientProfilePicture !== null) {
          item.recipientProfilePicture = await this._getSignedPostUrl(
            item.recipientProfilePicture,
          );
        }

        if (item.mediaType === "image") {
          const imageUrl = await this._getSignedPostUrl(item.imageUrl);
          item.imageUrl = imageUrl;
        } else {
          item.imageUrl = `https://stream.mux.com/${item.imageUrl}.m3u8`;
        }
      } catch (error) {
        console.error(
          `Error updating profile picture URLs for postId: ${item.postId}, authorId: ${item.authorId}, recipientId: ${item.recipientId}: `,
          error,
        );
        throw new DomainError(
          ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
          "Failed to get profile picture URL.",
        );
      }
      return item;
    });

    let nextCursor: PostCursor | undefined = undefined;
    if (items.length > pageSize) {
      const nextItem = await items[pageSize];
      if (!nextItem) {
        throw new DomainError(
          ErrorCode.FAILED_TO_PAGINATE_POSTS,
          "Failed to paginate posts.",
        );
      }
      nextCursor = {
        createdAt: nextItem.createdAt,
        postId: nextItem.postId,
      };
    }
    return {
      items: await Promise.all(items),
      nextCursor,
    };
  }

  private async _processPaginatedPostDataForFeed(
    data: Post[],
    pageSize: number,
  ): Promise<PaginatedResponse<Post, FeedCursor>> {
    const items = data.map(async (item) => {
      try {
        if (item.authorProfilePicture !== null) {
          item.authorProfilePicture = await this._getSignedPostUrl(
            item.authorProfilePicture,
          );
        }

        if (item.recipientProfilePicture !== null) {
          item.recipientProfilePicture = await this._getSignedPostUrl(
            item.recipientProfilePicture,
          );
        }

        if (item.mediaType === "image") {
          const imageUrl = await this._getSignedPostUrl(item.imageUrl);
          item.imageUrl = imageUrl;
        } else {
          item.imageUrl = `https://stream.mux.com/${item.imageUrl}.m3u8`;
        }
      } catch (error) {
        console.error(
          `Error updating profile picture URLs for postId: ${item.postId}, authorId: ${item.authorId}, recipientId: ${item.recipientId}: `,
          error,
        );
        throw new DomainError(
          ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
          "Failed to get profile picture URL.",
        );
      }
      return item;
    });

    let nextCursor: FeedCursor | undefined = undefined;
    if (items.length > pageSize) {
      const nextItem = await items[pageSize];
      if (!nextItem) {
        throw new DomainError(
          ErrorCode.FAILED_TO_PAGINATE_POSTS,
          "Failed to paginate posts.",
        );
      }
      nextCursor = {
        createdAt: nextItem.createdAt,
        type: "following",
        postId: nextItem.postId,
      };
    }
    return {
      items: await Promise.all(items),
      nextCursor,
    };
  }

  private async _updateProfilePictureUrls2(
    data: CommentProfile[],
    pageSize: number,
  ): Promise<PaginatedResponse<CommentProfile, CommentCursor>> {
    const items = data.map(async (item) => {
      try {
        if (item.profilePictureUrl !== null) {
          item.profilePictureUrl = await this._getSignedPostUrl(
            item.profilePictureUrl,
          );
        }
      } catch (error) {
        console.error(
          `Error updating profile picture URL for commentId: ${item.commentId}, userId: ${item.userId}: `,
          error,
        );
        throw new DomainError(
          ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
          "Failed to get comment profile picture URL.",
        );
      }
      return item;
    });

    let nextCursor: CommentCursor | undefined = undefined;
    if (items.length > pageSize) {
      const nextItem = await items[pageSize];
      if (!nextItem) {
        throw new DomainError(
          ErrorCode.FAILED_TO_PAGINATE_COMMENTS,
          "Failed to paginate comments.",
        );
      }

      nextCursor = {
        createdAt: nextItem.createdAt,
        commentId: nextItem.commentId,
      };
    }
    return {
      items: await Promise.all(items),
      nextCursor,
    };
  }

  private async _getSignedPostUrl(objectKey: string): Promise<string> {
    return await cloudfront.getSignedPrivatePostUrl(objectKey);
  }

  private async _getSignedPublicPostUrl(objectKey: string): Promise<string> {
    return await cloudfront.getSignedPublicPostUrl(objectKey);
  }
}

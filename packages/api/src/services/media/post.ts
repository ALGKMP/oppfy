import type { z } from "zod";

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
import { CloudFrontService } from "../aws/cloudfront";
import { NotificationsService } from "../user/notifications";
import { UserService } from "../user/user";

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: PostCursor | CommentCursor | undefined;
}

interface FollowingPostCursor {
  createdAt: Date;
  followerId: string;
}

interface PostCursor {
  createdAt: Date;
  postId: string;
}

type FeedCursorRewritten =
  | { type: "following"; cursor: FollowingPostCursor | null }
  | { type: "recommended"; cursor: PostCursor | null }
  | { type: "global"; cursor: PostCursor | null }
  | null;

interface CommentCursor {
  createdAt: Date;
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

  private cloudFrontService = new CloudFrontService();
  private notificationsService = new NotificationsService();
  private userService = new UserService();

  async paginatePostsOfUserSelf(
    userId: string,
    cursor: PostCursor | null = null,
    pageSize?: number,
  ): Promise<PaginatedResponse<Post>> {
    try {
      const data = await this.postRepository.paginatePostsOfUser(
        userId,
        cursor,
        pageSize,
      );
      const updatedData = this._processPaginatedPostData(data, pageSize);
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
    pageSize?: number;
    currentUserId: string;
  }): Promise<PaginatedResponse<Post>> {
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
      );
      const updatedData = this._processPaginatedPostData(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(`Error in getPosts for profile: ${userId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_POSTS,
        "Failed to paginate posts.",
      );
    }
  }

  async paginatePostsOfFollowing(
    userId: string,
    cursor: FollowingPostCursor | null = null,
    pageSize?: number,
  ) {
    try {
      const data = await this.postRepository.paginatePostsOfFollowing(
        userId,
        cursor,
      );
      const updatedData = this._processPaginatedPostData(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(`Error in getPosts for userId: ${userId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_POSTS,
        "Failed to paginate posts.",
      );
    }
  }

  async paginatePostsOfRecommended(
    userId: string,
    cursor: PostCursor | null = null,
    pageSize?: number,
  ) {
    try {
      const data = await this.postRepository.paginatePostsOfRecommended(
        userId,
        cursor,
      );
      const updatedData = this._processPaginatedPostData(data, pageSize);
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
    cursor: FeedCursorRewritten = null,
    pageSize = 10,
  ) {

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

    const followingResult = await this.postRepository.paginatePostsOfFollowing(
      userId,
      cursor?.type === "following" ? cursor.cursor : null,
      pageSize,
    );

    const parsedFollowingResult = this._processPaginatedPostData(
      followingResult,
      pageSize,
    );

    return parsedFollowingResult;

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

  async paginatePostsByUserSelf(
    userId: string,
    cursor: PostCursor | null = null,
    pageSize?: number,
  ): Promise<PaginatedResponse<Post>> {
    try {
      const data = await this.postRepository.paginatePostsByUser(
        userId,
        cursor,
      );
      const updatedData = this._processPaginatedPostData(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(`Error in getPosts for userId: ${userId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_POSTS,
        "Failed to paginate posts.",
      );
    }
  }

  async paginatePostsByUserOther(
    profileId: string,
    cursor: PostCursor | null = null,
    pageSize?: number,
  ): Promise<PaginatedResponse<Post>> {
    try {
      const user = await this.userRepository.getUserByProfileId(profileId);
      if (!user) {
        throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found.");
      }
      const data = await this.postRepository.paginatePostsByUser(
        user.id,
        cursor,
      );
      const updatedData = this._processPaginatedPostData(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(`Error in getPosts for profile: ${profileId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_POSTS,
        "Failed to paginate posts.",
      );
    }
  }

  async getPost(postId: string): Promise<Post> {
    try {
      const post = await this.postRepository.getPost(postId);
      if (!post[0]) {
        throw new DomainError(
          ErrorCode.FAILED_TO_GET_POST,
          "Failed to get post.",
        );
      }
      const updatedPost = this._processPostData(post[0]);
      return updatedPost;
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

  async deletePost(postId: string) {
    try {
      await this.postRepository.deletePost(postId);
    } catch (error) {
      console.error(`Error in deletePost for postId: ${postId}: `, error);
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

      const post = await this.getPost(postId);

      // Only store and send notification if the liker is not the post owner
      if (userId !== post.recipientId) {
        const recentNotifications =
          await this.notificationsService.getRecentNotifications({
            senderId: userId,
            recipientId: post.recipientId,
            eventType: "like",
            entityId: postId,
            entityType: "post",
            minutesThreshold: 10,
            limit: 1,
          });

        if (recentNotifications.length === 0) {
          await this.notificationsService.storeNotification(
            userId,
            post.recipientId,
            {
              eventType: "like",
              entityId: postId.toString(),
              entityType: "post",
            },
          );

          const { likes } =
            await this.notificationsService.getNotificationSettings(
              post.recipientId,
            );

          if (likes) {
            const user = await this.profileRepository.getUserProfile(userId);

            if (user === undefined) {
              throw new DomainError(ErrorCode.USER_NOT_FOUND);
            }

            const { profile } = user;

            await this.notificationsService.sendNotification(
              userId,
              post.recipientId,
              {
                title: "New like",
                body: `${profile.username} liked your post`,
                entityType: "post",
                entityId: postId.toString(),
              },
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

    const post = await this.getPost(postId);

    // Only store and send notification if the commenter is not the post owner
    if (userId !== post.recipientId) {
      const recentNotifications =
        await this.notificationsService.getRecentNotifications({
          senderId: userId,
          recipientId: post.recipientId,
          eventType: "comment",
          entityId: postId,
          entityType: "post",
          minutesThreshold: 10,
          limit: 1,
        });

      if (recentNotifications.length === 0) {
        await this.notificationsService.storeNotification(
          userId,
          post.recipientId,
          {
            eventType: "comment",
            entityId: postId.toString(),
            entityType: "post",
          },
        );

        const { comments } =
          await this.notificationsService.getNotificationSettings(
            post.recipientId,
          );

        if (comments) {
          const user = await this.profileRepository.getUserProfile(userId);

          if (user === undefined) {
            throw new DomainError(ErrorCode.USER_NOT_FOUND);
          }

          const { profile } = user;

          await this.notificationsService.sendNotification(
            userId,
            post.recipientId,
            {
              title: "New Comment",
              body: `${profile.username} commented on your post`,
              entityId: postId.toString(),
              entityType: "post",
            },
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

    if (post === undefined) {
      throw new DomainError(ErrorCode.POST_NOT_FOUND);
    }

    const comment = await this.commentRepository.getComment(commentId);

    if (comment === undefined) {
      throw new DomainError(ErrorCode.COMMENT_NOT_FOUND);
    }

    if (post.recipientId !== userId && comment.user !== userId) {
      throw new DomainError(ErrorCode.UNAUTHORIZED);
    }

    await this.commentRepository.removeComment(commentId);
    await this.postStatsRepository.decrementCommentsCount(postId);
  }

  async paginateComments(
    postId: string,
    cursor: CommentCursor | null = null,
    pageSize: number,
  ): Promise<PaginatedResponse<CommentProfile>> {
    try {
      const data = await this.commentRepository.paginateComments(
        postId,
        cursor,
        pageSize,
      );
      const updatedData = this._updateProfilePictureUrls2(data, pageSize);
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

  private _processPostData(data: Post): Post {
    try {
      // Update author profile picture URL
      if (data.authorProfilePicture !== null) {
        data.authorProfilePicture =
          this.cloudFrontService.getSignedUrlForProfilePicture(
            data.authorProfilePicture,
          );
      }

      if (data.recipientProfilePicture !== null) {
        data.recipientProfilePicture =
          this.cloudFrontService.getSignedUrlForProfilePicture(
            data.recipientProfilePicture,
          );
      }

      if (data.mediaType === "image") {
        const imageUrl = this.cloudFrontService.getSignedUrlForPost(
          data.imageUrl,
        );
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

  private _processPaginatedPostData(
    data: Post[],
    pageSize = 20,
  ): PaginatedResponse<Post> {
    const items = data.map((item) => {
      try {
        if (item.authorProfilePicture !== null) {
          item.authorProfilePicture =
            this.cloudFrontService.getSignedUrlForProfilePicture(
              item.authorProfilePicture,
            );
        }

        if (item.recipientProfilePicture !== null) {
          item.recipientProfilePicture =
            this.cloudFrontService.getSignedUrlForProfilePicture(
              item.recipientProfilePicture,
            );
        }

        if (item.mediaType === "image") {
          const imageUrl = this.cloudFrontService.getSignedUrlForPost(
            item.imageUrl,
          );
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
      const nextItem = items[pageSize];
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
      items,
      nextCursor,
    };
  }

  private _updateProfilePictureUrls2(
    data: CommentProfile[],
    pageSize: number,
  ): PaginatedResponse<CommentProfile> {
    const items = data.map((item) => {
      try {
        if (item.profilePictureUrl !== null) {
          item.profilePictureUrl =
            this.cloudFrontService.getSignedUrlForProfilePicture(
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
      const nextItem = items[pageSize];
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
      items,
      nextCursor,
    };
  }
}

import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { UserRepository } from "../../repositories";
import { CommentRepository } from "../../repositories/media/comment";
import { LikeRepository } from "../../repositories/media/like";
import { PostRepository } from "../../repositories/media/post";
import { PostStatsRepository } from "../../repositories/media/post-stats";
import { S3Service } from "../aws/s3";
import { env } from "@oppfy/env/server";

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: PostCursor | CommentCursor | undefined;
}

interface PostCursor {
  createdAt: Date;
  postId: number;
}

interface CommentCursor {
  createdAt: Date;
  commentId: number;
}

type CommentProfile = z.infer<typeof sharedValidators.media.comment>;

type Post = z.infer<typeof sharedValidators.media.post>;

export class PostService {
  private awsService = new S3Service();
  private likeRepository = new LikeRepository();
  private commentRepository = new CommentRepository();
  private postRepository = new PostRepository();
  private postStatsRepository = new PostStatsRepository();
  private userRepository = new UserRepository();

  private async _processPaginatedPostData(
    data: Post[],
    pageSize = 20,
  ): Promise<PaginatedResponse<Post>> {
    const items = await Promise.all(
      data.map(async (item) => {
        try {
          // Update author profile picture URL
          const authorPresignedUrl =
            await this.awsService.getObjectPresignedUrl({
              Bucket: env.S3_PROFILE_BUCKET,
              Key: item.authorProfilePicture ?? "profile-pictures/default.jpg",
            });
          item.authorProfilePicture = authorPresignedUrl;

          // Update recipient profile picture URL
          const recipientPresignedUrl =
            await this.awsService.getObjectPresignedUrl({
              Bucket: env.S3_PROFILE_BUCKET,
              Key:
                item.recipientProfilePicture ?? "profile-pictures/default.jpg",
            });
          item.recipientProfilePicture = recipientPresignedUrl;

          const imageUrl = await this.awsService.getObjectPresignedUrl({
            Bucket: env.S3_POST_BUCKET,
            Key: item.imageUrl,
          });
          item.imageUrl = imageUrl;
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
      }),
    );

    let nextCursor: PostCursor | undefined = undefined;
    if (items.length > pageSize) {
      const nextItem = items.pop();
      nextCursor = {
        createdAt: nextItem!.createdAt,
        postId: nextItem!.postId,
      };
    }
    return {
      items,
      nextCursor,
    };
  }

  private async _updateProfilePictureUrls2(
    data: CommentProfile[],
    pageSize: number,
  ): Promise<PaginatedResponse<CommentProfile>> {
    const items = await Promise.all(
      data.map(async (item) => {
        try {
          const presignedUrl = item.profilePictureUrl
            ? await this.awsService.getObjectPresignedUrl({
                Bucket: env.S3_PROFILE_BUCKET,
                Key: item.profilePictureUrl,
              })
            : await this.awsService.getObjectPresignedUrl({
                Bucket: env.S3_PROFILE_BUCKET,
                Key: "profile-pictures/default.jpg",
              });
          item.profilePictureUrl = presignedUrl;
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
      }),
    );

    let nextCursor: CommentCursor | undefined = undefined;
    if (items.length > pageSize) {
      const nextItem = items.pop();
      nextCursor = {
        createdAt: nextItem!.createdAt,
        commentId: nextItem!.commentId,
      };
      console.log("server: next cursor:", nextCursor);
    }
    return {
      items,
      nextCursor,
    };
  }

  async paginatePostsOfUserSelf(
    userId: string,
    cursor: PostCursor | null = null,
    pageSize?: number,
  ): Promise<PaginatedResponse<Post>> {
    try {
      const data = await this.postRepository.paginatePostsOfUser(
        userId,
        cursor,
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

  async paginatePostsOfUserOther(
    profileId: number,
    cursor: PostCursor | null = null,
    pageSize?: number,
  ): Promise<PaginatedResponse<Post>> {
    try {
      const user = await this.userRepository.getUserByProfileId(profileId);
      if (!user) {
        throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found.");
      }
      const data = await this.postRepository.paginatePostsOfUser(
        user.id,
        cursor,
      );
      const updatedData = await this._processPaginatedPostData(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(`Error in getPosts for profile: ${profileId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_POSTS,
        "Failed to paginate posts.",
      );
    }
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

  async paginatePostsByUserOther(
    profileId: number,
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
      const updatedData = await this._processPaginatedPostData(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error(`Error in getPosts for profile: ${profileId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_PAGINATE_POSTS,
        "Failed to paginate posts.",
      );
    }
  }

  async createPost(
    postedBy: string,
    postedFor: string,
    caption: string,
    objectKey: string,
  ) {
    try {
      const result = await this.postRepository.createPost(
        postedBy,
        postedFor,
        caption,
        objectKey,
      );

      const postId = result[0].insertId;
      await this.postStatsRepository.createPostStats(postId);
    } catch (error) {
      console.error(
        `Error in createPost by user: ${postedBy} for user: ${postedFor}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_CREATE_POST,
        "Failed to create post.",
      );
    }
  }

  async editPost(postId: number, newCaption: string) {
    try {
      await this.postRepository.updatePost(postId, newCaption);
    } catch (error) {
      console.error(`Error in editPost for postId: ${postId}: `, error);
      throw new DomainError(
        ErrorCode.FAILED_TO_EDIT_POST,
        "Failed to edit post.",
      );
    }
  }

  async deletePost(postId: number) {
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

  async likePost(userId: string, postId: number) {
    try {
      const like = await this.likeRepository.findLike(postId, userId);
      if (like) {
        throw new DomainError(
          ErrorCode.FAILED_TO_LIKE_POST,
          "Tried to like a post that was already liked.",
        );
      }
      await this.likeRepository.addLike(postId, userId);
      await this.postStatsRepository.incrementLikesCount(postId);
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

  async unlikePost(userId: string, postId: number) {
    try {
      const like = await this.likeRepository.findLike(postId, userId);
      if (!like) {
        throw new DomainError(
          ErrorCode.FAILED_TO_UNLIKE_POST,
          "Tried to unlike a post that was not liked.",
        );
      }
      await this.likeRepository.removeLike(postId, userId);
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

  async getLike(userId: string, postId: number) {
    try {
      return await this.likeRepository.findLike(postId, userId);
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

  async commentOnPost(userId: string, postId: number, commentBody: string) {
    try {
      await this.commentRepository.addComment(postId, userId, commentBody);
      await this.postStatsRepository.incrementCommentsCount(postId);
    } catch (error) {
      console.error(
        `Error in addCommentToPost for userId: ${userId}, postId: ${postId}, commentText: ${commentBody}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_ADD_COMMENT,
        "Failed to add comment to post.",
      );
    }
  }

  async deleteComment(commentId: number, postId: number) {
    try {
      await this.commentRepository.removeComment(commentId);
      await this.postStatsRepository.decrementCommentsCount(postId);
    } catch (error) {
      console.error(
        `Error in deleteComment for commentId: ${commentId}: `,
        error,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_DELETE_COMMENT,
        `Failed to delete comment for commentId: ${commentId}.`,
      );
    }
  }

  async paginateComments(
    postId: number,
    cursor: CommentCursor | null = null,
    pageSize: number,
  ): Promise<PaginatedResponse<CommentProfile>> {
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
}

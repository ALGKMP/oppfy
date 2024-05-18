import { DomainError, ErrorCode } from "../errors";
import { CommentRepository } from "../repositories/comment";
import { LikeRepository } from "../repositories/like";
import { PostRepository } from "../repositories/post";
import { PostStatsRepository } from "../repositories/post-stats";
import { AwsService } from "./aws";

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

interface CommentProfile {
  commentId: number;
  userId: string;
  username: string | null;
  body: string;
  profilePictureUrl: string;
  createdAt: Date;
}

export interface Post {
  postId: number;
  authorId: string;
  authorUsername: string | null;
  authorProfilePicture: string;
  recipientId: string;
  recipientUsername: string | null;
  recipientProfilePicture: string;
  imageUrl: string;
  caption: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
}

export class PostService {
  private awsService = new AwsService();
  private likeRepository = new LikeRepository();
  private commentRepository = new CommentRepository();
  private postRepository = new PostRepository();
  private postStatsRepository = new PostStatsRepository();

  private async _updateProfilePictureUrls(
    data: Post[],
    pageSize = 20,
  ): Promise<PaginatedResponse<Post>> {
    const items = await Promise.all(
      data.map(async (item) => {
        // Update author profile picture URL
        const authorPresignedUrl = await this.awsService.getObjectPresignedUrl({
          Bucket: process.env.S3_PROFILE_BUCKET!,
          Key: item.authorProfilePicture ?? "profile-pictures/default.jpg",
        });
        item.authorProfilePicture = authorPresignedUrl;

        // Update recipient profile picture URL
        const recipientPresignedUrl =
          await this.awsService.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: item.recipientProfilePicture ?? "profile-pictures/default.jpg",
          });
        item.recipientProfilePicture = recipientPresignedUrl;

        const imageUrl = await this.awsService.getObjectPresignedUrl({
          Bucket: process.env.S3_POST_BUCKET!,
          Key: item.imageUrl,
        });
        item.imageUrl = imageUrl;
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
      console.log("server: ", nextCursor);
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
        const presignedUrl = item.profilePictureUrl
          ? await this.awsService.getObjectPresignedUrl({
              Bucket: process.env.S3_PROFILE_BUCKET!,
              Key: item.profilePictureUrl,
            })
          : await this.awsService.getObjectPresignedUrl({
              Bucket: process.env.S3_PROFILE_BUCKET!,
              Key: "profile-pictures/default.jpg",
            });
        item.profilePictureUrl = presignedUrl;
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

  async getPosts(
    userId: string,
    cursor: PostCursor | null = null,
    pageSize?: number,
  ): Promise<PaginatedResponse<Post>> {
    try {
      const data = await this.postRepository.getPaginatedPosts(userId, cursor);
      const updatedData = await this._updateProfilePictureUrls(data, pageSize);
      return updatedData;
    } catch (error) {
      console.error("Error in getPosts: ", error);
      throw new DomainError(ErrorCode.FAILED_TO_PAGINATE_POSTS);
    }
  }

  async createPost(
    postedBy: string,
    postedFor: string,
    caption: string,
    objectKey: string,
  ) {
    const result = await this.postRepository.createPost(
      postedBy,
      postedFor,
      caption,
      objectKey,
    );

    const postId = result[0].insertId;
    await this.postStatsRepository.createPostStats(postId);
  }

  async editPost(postId: number, newCaption: string) {
    await this.postRepository.updatePost(postId, newCaption);
  }

  async getPost(postId: number) {
    const post = await this.postRepository.getPost(postId);

    if (post === undefined) {
      throw new DomainError(ErrorCode.POST_NOT_FOUND);
    }

    return post;
  }

  async deletePost(postId: number) {
    await this.postRepository.deletePost(postId);
  }

  async likePost(userId: string, postId: number) {
    const likeExists = await this.likeRepository.hasUserLiked(postId, userId);
    if (!likeExists) {
      await this.likeRepository.addLike(postId, userId);
    }
  }

  async unlikePost(userId: string, postId: number) {
    await this.likeRepository.removeLike(postId, userId);
  }

  async addCommentToPost(userId: string, postId: number, commentText: string) {
    await this.commentRepository.addComment(postId, userId, commentText);
  }

  async deleteComment(commentId: number) {
    await this.commentRepository.removeComment(commentId);
  }

  async getPaginatedComments(
    postId: number,
    cursor: CommentCursor | null = null,
    pageSize: number,
  ): Promise<PaginatedResponse<CommentProfile>> {
    const data = await this.commentRepository.getPaginatedComments(
      postId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls2(data, pageSize);
  }
}

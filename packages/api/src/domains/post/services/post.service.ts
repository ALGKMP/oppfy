import { cloudfront } from "@oppfy/cloudfront";

import { DomainError, ErrorCode } from "../../../errors";
import {
  type IPostLikeRepository,
  type IPostRepository,
  type IPostStatsRepository,
  type Post,
} from "../interfaces/post-repository.interface";
import { type IPostService } from "../interfaces/post-service.interface";

export class PostService implements IPostService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postStatsRepository: IPostStatsRepository,
    private readonly postLikeRepository: IPostLikeRepository,
  ) {}

  async uploadPicturePostForUserOnApp(params: {
    author: string;
    recipient: string;
    caption: string;
    height: string;
    width: string;
    contentLength: number;
    contentType: string;
  }): Promise<Post> {
    // Generate a unique key for the post
    const key = `${params.author}/${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create the post
    const post = await this.postRepository.createPost({
      authorId: params.author,
      recipientId: params.recipient,
      caption: params.caption,
      key,
      mediaType: "image",
      height: parseInt(params.height),
      width: parseInt(params.width),
    });

    return post;
  }

  async likePost(params: { userId: string; postId: string }): Promise<void> {
    const post = await this.postRepository.getPostById(params.postId);
    if (!post) {
      throw new DomainError(ErrorCode.POST_NOT_FOUND, "Post not found");
    }

    const alreadyLiked = await this.postLikeRepository.getLike(
      params.userId,
      params.postId,
    );
    if (alreadyLiked) {
      throw new DomainError(ErrorCode.POST_ALREADY_LIKED, "Post already liked");
    }

    await this.postLikeRepository.createLike(params);
    await this.postStatsRepository.incrementLikesCount(params.postId);
  }

  async unlikePost(params: { userId: string; postId: string }): Promise<void> {
    const post = await this.postRepository.getPostById(params.postId);
    if (!post) {
      throw new DomainError(ErrorCode.POST_NOT_FOUND, "Post not found");
    }

    const liked = await this.postLikeRepository.getLike(
      params.userId,
      params.postId,
    );
    if (!liked) {
      throw new DomainError(ErrorCode.POST_NOT_LIKED, "Post not liked");
    }

    await this.postLikeRepository.deleteLike(params.userId, params.postId);
    await this.postStatsRepository.decrementLikesCount(params.postId);
  }

  async getPostById(postId: string): Promise<Post> {
    const post = await this.postRepository.getPostById(postId);
    if (!post) {
      throw new DomainError(ErrorCode.POST_NOT_FOUND, "Post not found");
    }
    return post;
  }

  async deletePost(params: { userId: string; postId: string }): Promise<void> {
    const post = await this.postRepository.getPostById(params.postId);
    if (!post) {
      throw new DomainError(ErrorCode.POST_NOT_FOUND, "Post not found");
    }

    if (post.authorId !== params.userId) {
      throw new DomainError(
        ErrorCode.UNAUTHORIZED,
        "User not authorized to delete this post",
      );
    }

    await this.postRepository.deletePost(params.postId);
  }

  private async _getSignedPostUrl(key: string) {
    const url = cloudfront.getPrivatePostUrl(key);
    return await cloudfront.getSignedUrl({ url });
  }

  private async _getSignedPublicPostUrl(key: string) {
    const url = cloudfront.getPublicPostUrl(key);
    return await cloudfront.getSignedUrl({ url });
  }
}

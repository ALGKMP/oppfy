import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { cloudfront } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";
import { env } from "@oppfy/env";
import { mux } from "@oppfy/mux";
import { s3 } from "@oppfy/s3";

import { TYPES } from "../../container";
import { PostErrors } from "../../errors/content/post.error";
import type { IPostRepository } from "../../interfaces/repositories/content/postRepository.interface";
import type { IPostStatsRepository } from "../../interfaces/repositories/content/postStatsRepository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/userRepository.interface";
import type {
  DeletePostParams,
  GetPostForNextJsParams,
  GetPostParams,
  IPostService,
  PaginatedResponse,
  PaginatePostsForFeedParams,
  PaginatePostsParams,
  PostCursor,
  UpdatePostParams,
  UploadPostForUserNotOnAppUrlParams,
  UploadPostForUserOnAppUrlParams,
  UploadVideoPostForUserNotOnAppUrlParams,
  UploadVideoPostForUserOnAppUrlParams,
} from "../../interfaces/services/content/postService.interface";
import type { Post } from "../../models";

@injectable()
export class PostService implements IPostService {
  constructor(
    @inject(TYPES.Database)
    private db: Database,
    @inject(TYPES.PostRepository)
    private postRepository: IPostRepository,
    @inject(TYPES.PostStatsRepository)
    private postStatsRepository: IPostStatsRepository,
    @inject(TYPES.UserRepository)
    private userRepository: IUserRepository,
  ) {}

  async uploadPostForUserOnAppUrl(
    params: UploadPostForUserOnAppUrlParams,
  ): Promise<{ presignedUrl: string; postId: string }> {
    const {
      author,
      recipient,
      caption,
      height,
      width,
      contentLength,
      contentType,
    } = params;

    try {
      const currentDate = Date.now();
      const objectKey = `posts/${currentDate}-${recipient}-${author}.jpg`;
      const postId = randomUUID();

      const presignedUrl = await s3.putObjectPresignedUrl({
        Bucket: env.S3_POST_BUCKET,
        Key: objectKey,
        ContentLength: contentLength,
        ContentType: contentType,
        Metadata: { author, recipient, caption, height, width, postid: postId },
      });

      return { presignedUrl, postId };
    } catch (err) {
      throw new PostErrors.FailedToCreatePost(author);
    }
  }

  async uploadPostForUserNotOnAppUrl(
    params: UploadPostForUserNotOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  > {
    const {
      author,
      recipientNotOnAppPhoneNumber,
      recipientNotOnAppName,
      caption,
      height,
      width,
      contentLength,
      contentType,
    } = params;

    await this.db.transaction(async (tx) => {
      const recipient = await this.userRepository.getUserByPhoneNumber({
        phoneNumber: recipientNotOnAppPhoneNumber,
      });
      const recipientId = recipient ? recipient.id : randomUUID();

      if (!recipient) {
        await this.userRepository.createUser(
          {
            userId: recipientId,
            name: recipientNotOnAppName,
            phoneNumber: recipientNotOnAppPhoneNumber,
            username: recipientNotOnAppName,
            isOnApp: false,
          },
          tx,
        );
      }

      const currentDate = Date.now();
      const objectKey = `posts/${currentDate}-${recipientId}-${author}.jpg`;
      const postId = randomUUID();

      try {
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

        return ok({ presignedUrl, postId });
      } catch (err) {
        throw new PostErrors.FailedToCreatePost(author);
      }
    });
  }

  async uploadVideoPostForUserOnAppUrl(
    params: UploadVideoPostForUserOnAppUrlParams,
  ): Promise<{ presignedUrl: string; postId: string }> {
    const { author, recipient, caption, height, width } = params;

    try {
      const postId = randomUUID();

      const presignedUrl = await mux.getPresignedUrlForVideo({
        author,
        recipient,
        caption,
        height,
        width,
        postid: postId,
      });

      return { presignedUrl, postId };
    } catch (err) {
      throw new PostErrors.FailedToCreatePost(author);
    }
  }

  async uploadVideoPostForUserNotOnAppUrl(
    params: UploadVideoPostForUserNotOnAppUrlParams,
  ): Promise<{ presignedUrl: string; postId: string }> {
    const {
      author,
      recipientNotOnAppPhoneNumber,
      recipientNotOnAppName,
      caption,
      height,
      width,
    } = params;

    await this.db.transaction(async (tx) => {
      const recipient = await this.userRepository.getUserByPhoneNumber({
        phoneNumber: recipientNotOnAppPhoneNumber,
      });
      const recipientId = recipient ? recipient.id : randomUUID();

      if (!recipient) {
        await this.userRepository.createUser(
          {
            userId: recipientId,
            name: recipientNotOnAppName,
            phoneNumber: recipientNotOnAppPhoneNumber,
            username: recipientNotOnAppName,
            isOnApp: false,
          },
          tx,
        );
      }

      const postId = randomUUID();

      try {
        const presignedUrl = await mux.getPresignedUrlForVideo({
          author,
          recipient: recipientId,
          caption,
          height,
          width,
          postid: postId,
        });

        return { presignedUrl, postId };
      } catch (err) {
        throw new PostErrors.FailedToCreatePost(author);
      }
    });
  }

  async deletePost(
    params: DeletePostParams,
  ): Promise<
    Result<
      void,
      | PostErrors.FailedToDeletePost
      | PostErrors.PostNotFound
      | PostErrors.NotPostOwner
      | PostErrors.PostDeleted
    >
  > {
    const { userId, postId } = params;

    await this.db.transaction(async (tx) => {
      await this.postRepository.deletePost({ postId, userId }, tx);
    });

    return ok(undefined);
  }

  async getPost(
    params: GetPostParams,
  ): Promise<Result<Post, PostErrors.PostNotFound>> {
    const { userId, postId } = params;

    const post = await this.postRepository.getPost({ postId, userId });
    if (!post) {
      return err(new PostErrors.PostNotFound(postId));
    }

    return ok(post);
  }

  async paginatePosts(
    params: PaginatePostsParams,
  ): Promise<Result<PaginatedResponse<Post, PostCursor>, never>> {
    const { userId, cursor, pageSize = 20 } = params;

    const posts = await this.postRepository.paginatePosts({
      userId,
      cursor,
      pageSize,
    });

    return ok({
      items: posts,
      nextCursor:
        posts.length === pageSize
          ? {
              postId: posts[posts.length - 1]!.id,
              createdAt: posts[posts.length - 1]!.createdAt,
            }
          : null,
    });
  }

  async paginatePostsForFeed(
    params: PaginatePostsForFeedParams,
  ): Promise<PaginatedResponse<Post, PostCursor>> {
    const { userId, cursor, pageSize } = params;

    const posts = await this.postRepository.paginatePostsOfFollowing({
      userId,
      cursor,
      pageSize,
    });

    return {
      items: posts,
      nextCursor:
        posts.length === pageSize
          ? {
              postId: posts[posts.length - 1]!.id,
              createdAt: posts[posts.length - 1]!.createdAt,
              type: "following",
            }
          : null,
    };
  }

  async getPostForNextJs(
    params: GetPostForNextJsParams,
  ): Promise<Omit<Post, "hasLiked">> {
    const { postId } = params;

    const post = await this.postRepository.getPostForNextJs({ postId });
    if (!post) {
      throw new PostErrors.PostNotFound(postId);
    }

    const user = await this.userRepository.getUser({ userId: post.authorId });
    if (!user) {
      throw new PostErrors.PostNotFound(postId);
    }

    if (user.privacySetting !== "public") {
      throw new PostErrors.PostNotFound(postId);
    }

    return post;
  }
}

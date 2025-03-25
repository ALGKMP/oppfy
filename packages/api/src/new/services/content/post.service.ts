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
import type {
  IPostRepository,
  PostForNextJs,
  Post as RepositoryPost,
} from "../../interfaces/repositories/content/postRepository.interface";
import type { IPostStatsRepository } from "../../interfaces/repositories/content/postStatsRepository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/userRepository.interface";
import type {
  DeletePostParams,
  FeedCursor,
  GetPostForNextJsParams,
  GetPostParams,
  IPostService,
  PaginatedResponse,
  PaginatePostsForFeedParams,
  PaginatePostsParams,
  Post,
  PostCursor,
  UpdatePostParams,
  UploadPostForUserNotOnAppUrlParams,
  UploadPostForUserOnAppUrlParams,
  UploadVideoPostForUserNotOnAppUrlParams,
  UploadVideoPostForUserOnAppUrlParams,
} from "../../interfaces/services/content/postService.interface";

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
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  > {
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

      return ok({ presignedUrl, postId });
    } catch (error: unknown) {
      return err(new PostErrors.FailedToCreatePost(author));
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

    try {
      let presignedUrl: string | undefined;
      let postId: string | undefined;

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

        postId = randomUUID();
        const currentDate = Date.now();
        const objectKey = `posts/${currentDate}-${recipientId}-${author}.jpg`;

        presignedUrl = await s3.putObjectPresignedUrl({
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
      });

      if (!presignedUrl || !postId) {
        return err(new PostErrors.FailedToCreatePost(author));
      }

      return ok({ presignedUrl, postId });
    } catch (error) {
      return err(new PostErrors.FailedToCreatePost(author));
    }
  }

  async uploadVideoPostForUserOnAppUrl(
    params: UploadVideoPostForUserOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  > {
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

      return ok({ presignedUrl, postId });
    } catch (error: unknown) {
      return err(new PostErrors.FailedToCreatePost(author));
    }
  }

  async uploadVideoPostForUserNotOnAppUrl(
    params: UploadVideoPostForUserNotOnAppUrlParams,
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
    } = params;

    try {
      let presignedUrl: string | undefined;
      let postId: string | undefined;

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

        postId = randomUUID();

        presignedUrl = await mux.getPresignedUrlForVideo({
          author,
          recipient: recipientId,
          caption,
          height,
          width,
          postid: postId,
        });
      });

      if (!presignedUrl || !postId) {
        return err(new PostErrors.FailedToCreatePost(author));
      }

      return ok({ presignedUrl, postId });
    } catch (error) {
      return err(new PostErrors.FailedToCreatePost(author));
    }
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

    return ok({
      id: post.postId,
      authorId: post.authorId,
      recipientId: post.recipientId,
      caption: post.caption,
      key: post.imageUrl,
      width: post.width,
      height: post.height,
      mediaType: post.mediaType as "image" | "video",
      postType: "public",
      privacy: "public",
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
    });
  }

  async paginatePosts(
    params: PaginatePostsParams,
  ): Promise<Result<PaginatedResponse<Post, PostCursor>, never>> {
    const { userId, cursor, pageSize = 20 } = params;

    const posts = await this.postRepository.paginatePostsOfUser({
      userId,
      cursor,
      pageSize,
    });

    return ok({
      items: posts.map((post) => ({
        id: post.postId,
        authorId: post.authorId,
        recipientId: post.recipientId,
        caption: post.caption,
        key: post.imageUrl,
        width: post.width,
        height: post.height,
        mediaType: post.mediaType as "image" | "video",
        postType: "public",
        privacy: "public",
        createdAt: post.createdAt,
        updatedAt: post.createdAt,
      })),
      nextCursor:
        posts.length === pageSize
          ? {
              postId: posts[posts.length - 1]!.postId,
              createdAt: posts[posts.length - 1]!.createdAt,
            }
          : null,
    });
  }

  async paginatePostsForFeed(
    params: PaginatePostsForFeedParams,
  ): Promise<
    Result<PaginatedResponse<Post, FeedCursor>, PostErrors.PostNotFound>
  > {
    try {
      const { userId, cursor, pageSize } = params;

      const posts = await this.postRepository.paginatePostsOfFollowing({
        userId,
        cursor,
        pageSize,
      });

      return ok({
        items: posts.map((post) => ({
          id: post.postId,
          authorId: post.authorId,
          recipientId: post.recipientId,
          caption: post.caption,
          key: post.imageUrl,
          width: post.width,
          height: post.height,
          mediaType: post.mediaType as "image" | "video",
          postType: "public",
          privacy: "public",
          createdAt: post.createdAt,
          updatedAt: post.createdAt,
        })),
        nextCursor:
          posts.length === pageSize
            ? {
                postId: posts[posts.length - 1]!.postId,
                createdAt: posts[posts.length - 1]!.createdAt,
                type: "following" as const,
              }
            : null,
      });
    } catch (error: unknown) {
      return err(new PostErrors.PostNotFound(""));
    }
  }

  async getPostForNextJs(
    params: GetPostForNextJsParams,
  ): Promise<Result<Omit<Post, "hasLiked">, PostErrors.PostNotFound>> {
    try {
      const { postId } = params;

      const post = await this.postRepository.getPostForNextJs({ postId });
      if (!post) {
        return err(new PostErrors.PostNotFound(postId));
      }

      const user = await this.userRepository.getUserWithProfile({
        userId: post.authorId,
      });
      if (!user) {
        return err(new PostErrors.PostNotFound(postId));
      }

      if (user.profile.privacy !== "public") {
        return err(new PostErrors.PostNotFound(postId));
      }

      return ok({
        id: post.postId,
        authorId: post.authorId,
        recipientId: post.recipientId,
        caption: post.caption,
        key: post.imageUrl,
        width: post.width,
        height: post.height,
        mediaType: post.mediaType as "image" | "video",
        postType: "public",
        privacy: "public",
        createdAt: post.createdAt,
        updatedAt: post.createdAt,
      });
    } catch (error: unknown) {
      return err(new PostErrors.PostNotFound(params.postId));
    }
  }
}

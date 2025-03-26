import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";
import { env } from "@oppfy/env";
import { mux } from "@oppfy/mux";
import { s3 } from "@oppfy/s3";

import { TYPES } from "../../container";
import { PostErrors } from "../../errors/content/post.error";
import type {
  IPostRepository,
  PostResult,
  PostResultWithoutLike,
} from "../../interfaces/repositories/content/postRepository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profileRepository.interface";
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
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.PostRepository)
    private readonly postRepository: IPostRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
  ) {}

  private async generatePresignedUrl(
    key: string,
    contentLength: number,
    contentType: string,
    metadata: Record<string, string>,
  ): Promise<string> {
    return s3.putObjectPresignedUrl({
      Bucket: env.S3_POST_BUCKET,
      Key: key,
      ContentLength: contentLength,
      ContentType: contentType,
      Metadata: metadata,
    });
  }

  private async handleUpload(
    params:
      | UploadPostForUserOnAppUrlParams
      | UploadPostForUserNotOnAppUrlParams
      | UploadVideoPostForUserOnAppUrlParams
      | UploadVideoPostForUserNotOnAppUrlParams,
    isVideo: boolean,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  > {
    const { author, caption, height, width } = params;
    const postId = randomUUID();
    const currentDate = Date.now();

    try {
      if ("recipient" in params) {
        // On-app user cases
        const { recipient } = params;
        if (isVideo) {
          const presignedUrl = await mux.getPresignedUrlForVideo({
            author,
            recipient,
            caption,
            height,
            width,
            postid: postId,
          });
          return ok({ presignedUrl, postId });
        } else {
          const { contentLength, contentType } =
            params as UploadPostForUserOnAppUrlParams;
          const objectKey = `posts/${currentDate}-${recipient}-${author}.jpg`;
          const presignedUrl = await this.generatePresignedUrl(
            objectKey,
            contentLength,
            contentType,
            {
              author,
              recipient,
              caption,
              height,
              width,
              postid: postId,
            },
          );
          return ok({ presignedUrl, postId });
        }
      } else {
        // Not-on-app user cases
        const { recipientNotOnAppPhoneNumber, recipientNotOnAppName } = params;
        let result: { presignedUrl: string; postId: string } | undefined;

        await this.db.transaction(async (tx) => {
          const recipient = await this.userRepository.getUserByPhoneNumber({
            phoneNumber: recipientNotOnAppPhoneNumber,
          });
          const recipientId = recipient?.id ?? randomUUID();

          if (!recipient) {
            await this.userRepository.createUserNotOnApp(
              {
                userId: recipientId,
                name: recipientNotOnAppName,
                phoneNumber: recipientNotOnAppPhoneNumber,
                username: recipientNotOnAppName,
              },
              tx,
            );
          }

          if (isVideo) {
            result = {
              presignedUrl: await mux.getPresignedUrlForVideo({
                author,
                recipient: recipientId,
                caption,
                height,
                width,
                postid: postId,
              }),
              postId,
            };
          } else {
            const { contentLength, contentType } =
              params as UploadPostForUserNotOnAppUrlParams;
            const objectKey = `posts/${currentDate}-${recipientId}-${author}.jpg`;
            result = {
              presignedUrl: await this.generatePresignedUrl(
                objectKey,
                contentLength,
                contentType,
                {
                  author,
                  caption,
                  height,
                  width,
                  recipient: recipientId,
                  postid: postId,
                },
              ),
              postId,
            };
          }
        });

        if (!result) throw new Error("Failed to generate upload URL");
        return ok(result);
      }
    } catch (error) {
      return err(new PostErrors.FailedToCreatePost(author));
    }
  }

  async uploadPostForUserOnAppUrl(
    params: UploadPostForUserOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  > {
    return this.handleUpload(params, false);
  }

  async uploadPostForUserNotOnAppUrl(
    params: UploadPostForUserNotOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  > {
    return this.handleUpload(params, false);
  }

  async uploadVideoPostForUserOnAppUrl(
    params: UploadVideoPostForUserOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  > {
    return this.handleUpload(params, true);
  }

  async uploadVideoPostForUserNotOnAppUrl(
    params: UploadVideoPostForUserNotOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  > {
    return this.handleUpload(params, true);
  }

  async deletePost(
    params: DeletePostParams,
  ): Promise<Result<void, PostErrors.NotPostOwner | PostErrors.PostNotFound>> {
    await this.db.transaction(async (tx) => {
      // check if the post owner is the same as the user
      const post = await this.postRepository.getPost(
        { postId: params.postId, userId: params.userId },
        tx,
      );
      if (!post) return err(new PostErrors.PostNotFound(params.postId));
      if (post.post.authorUserId !== params.userId)
        return err(new PostErrors.NotPostOwner(params.userId, params.postId));
      await this.postRepository.deletePost(params, tx);
    });
    return ok(undefined);
  }

  async getPost(
    params: GetPostParams,
  ): Promise<
    Result<PostResult, PostErrors.PostNotFound | PostErrors.PostDeleted>
  > {
    const post = await this.postRepository.getPost(params);
    if (!post) return err(new PostErrors.PostNotFound(params.postId));
    return ok(post);
  }

  async paginatePosts(
    params: PaginatePostsParams,
  ): Promise<Result<PaginatedResponse<PostResult, PostCursor | null>, never>> {
    const { userId, cursor, pageSize = 20 } = params;
    const posts = await this.postRepository.paginatePostsOfUser({
      userId,
      cursor,
      pageSize,
    });

    const lastPost = posts[pageSize - 1];
    return ok({
      items: posts.slice(0, pageSize),
      nextCursor:
        posts.length > pageSize && lastPost
          ? {
              postId: lastPost.post.id,
              createdAt: lastPost.post.createdAt,
            }
          : null,
    });
  }

  async paginatePostsForFeed(
    params: PaginatePostsForFeedParams,
  ): Promise<
    Result<PaginatedResponse<PostResult, FeedCursor>, PostErrors.PostNotFound>
  > {
    const { userId, cursor, pageSize } = params;
    const posts = await this.postRepository.paginatePostsOfFollowing({
      userId,
      cursor,
      pageSize,
    });
    if (!posts.length && cursor)
      return err(new PostErrors.PostNotFound(cursor.postId));

    const lastPost = posts[pageSize - 1];
    return ok({
      items: posts.slice(0, pageSize),
      nextCursor:
        posts.length > pageSize && lastPost
          ? {
              postId: lastPost.post.id,
              createdAt: lastPost.post.createdAt,
              type: "following",
            }
          : null,
    });
  }

  async getPostForNextJs(
    params: GetPostForNextJsParams,
  ): Promise<Result<PostResultWithoutLike, PostErrors.PostNotFound>> {
    const post = await this.postRepository.getPostForNextJs(params);
    if (!post) return err(new PostErrors.PostNotFound(params.postId));

    const profile = await this.profileRepository.getProfile({
      userId: post.post.authorUserId,
    });
    if (!profile || profile.privacy !== "public") {
      return err(new PostErrors.PostNotFound(params.postId));
    }

    return ok(post);
  }

  async updatePost(
    params: UpdatePostParams,
  ): Promise<
    Result<
      void,
      | PostErrors.FailedToUpdatePost
      | PostErrors.PostNotFound
      | PostErrors.NotPostOwner
    >
  > {
    const { userId, postId, content: caption } = params; // Map content to caption
    await this.db.transaction(async (tx) => {
      const post = await this.postRepository.getPost({ postId, userId }, tx);
      if (!post) return err(new PostErrors.PostNotFound(postId));
      if (post.post.authorUserId !== userId)
        return err(new PostErrors.NotPostOwner(userId, postId));

      await this.postRepository.updatePost({ postId, caption }, tx);
    });
    return ok(undefined);
  }
}

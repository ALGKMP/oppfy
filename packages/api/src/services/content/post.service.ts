import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront, Hydrate } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";
import { env } from "@oppfy/env";
import { Mux } from "@oppfy/mux";
import { S3 } from "@oppfy/s3";

import * as PostErrors from "../../errors/content/post.error";
import { Comment, Post, PostStats, Profile } from "../../models";
import { CommentRepository } from "../../repositories/content/comment.repository";
import type { PaginatedCommentResult as RawPaginatedComment } from "../../repositories/content/comment.repository";
import {../../types/types
  PostRepository,
  PostResult,
} from "../../repositories/content/post.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { UserRepository } from "../../repositories/user/user.repository";
import { TYPES } from "../../symbols";
import type { PaginatedResponse, PaginationParams } from "../../types";

interface UploadPostForUserOnAppUrlParams {
  authorUserId: string;
  recipientUserId: string;
  caption: string;
  height: number;
  width: number;
  contentLength: number;
  contentType: "image/jpeg" | "image/png" | "image/heic";
}

interface UploadPostForUserNotOnAppUrlParams {
  authorUserId: string;
  recipientNotOnAppPhoneNumber: string;
  recipientNotOnAppName: string;
  caption: string;
  height: number;
  width: number;
  contentLength: number;
  contentType: "image/jpeg" | "image/png" | "image/heic";
}

interface UploadVideoPostForUserOnAppUrlParams {
  authorUserId: string;
  recipientUserId: string;
  caption: string;
  height: number;
  width: number;
}

interface UploadVideoPostForUserNotOnAppUrlParams {
  authorUserId: string;
  recipientNotOnAppPhoneNumber: string;
  recipientNotOnAppName: string;
  caption: string;
  height: number;
  width: number;
}

interface CreatePostParams {
  authorUserId: string;
  recipientUserId: string;
  caption: string;
  height: number;
  width: number;
  mediaType: "image" | "video";
}

interface DeletePostParams {
  userId: string;
  postId: string;
}

interface GetPostParams {
  postId: string;
  userId: string;
}

interface GetPostForSiteParams {
  postId: string;
}

interface PaginatePostsParams extends PaginationParams {
  userId: string;
}

interface PaginateCommentsParams extends PaginationParams {
  postId: string;
}

interface HydratedPostResult<
  T extends "withIsLiked" | "withoutIsLiked" | undefined = undefined,
> {
  post: Hydrate<Post>;
  postStats: PostStats;
  authorProfile: Hydrate<Profile<"onboarded">>;
  recipientProfile: Hydrate<Profile<"notOnApp">>;
  isLiked: T extends "withIsLiked" ? boolean : undefined;
}

@injectable()
export class PostService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.PostRepository)
    private readonly postRepository: PostRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TYPES.CommentRepository)
    private readonly commentRepository: CommentRepository,
    @inject(TYPES.S3)
    private readonly s3: S3,
    @inject(TYPES.CloudFront)
    private readonly cloudfront: CloudFront,
    @inject(TYPES.Mux)
    private readonly mux: Mux,
  ) {}

  private async createPost(
    params: CreatePostParams,
  ): Promise<Result<Post, PostErrors.FailedToCreatePost>> {
    // transaction to create post and post stats
    const currentDate = Date.now();
    const postKey = `posts/${currentDate}-${params.recipientUserId}-${params.authorUserId}.jpg`;

    const result = await this.db.transaction(async (tx) => {
      const post = await this.postRepository.createPost(
        {
          authorUserId: params.authorUserId,
          recipientUserId: params.recipientUserId,
          caption: params.caption,
          width: params.width,
          height: params.height,
          mediaType: params.mediaType,
          postKey,
          status: "pending",
        },
        tx,
      );

      if (!post) {
        return err(new PostErrors.FailedToCreatePost(params.authorUserId));
      }

      await this.postRepository.createPostStats(
        {
          postId: post.id,
        },
        tx,
      );
      return ok(post);
    });

    return result;
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
    const currentDate = Date.now();

    try {
      if ("recipientUserId" in params) {
        const result = await this.createPost({
          authorUserId: params.authorUserId,
          recipientUserId: params.recipientUserId,
          caption: params.caption,
          height: params.height,
          width: params.width,
          mediaType: isVideo ? "video" : "image",
        });

        if (result.isErr()) {
          return err(result.error);
        }

        const post = result.value;

        if (isVideo) {
          const presignedUrl = await this.mux.getPresignedUrlForVideo({
            postid: post.id,
          });
          return ok({ presignedUrl, postId: post.id });
        } else {
          const { contentLength, contentType } =
            params as UploadPostForUserOnAppUrlParams;
          const objectKey = `posts/${currentDate}-${params.recipientUserId}-${params.authorUserId}.jpg`;
          const presignedUrl = await this.s3.putObjectPresignedUrl({
            Bucket: env.S3_POST_BUCKET,
            Key: objectKey,
            ContentLength: contentLength,
            ContentType: contentType,
            Metadata: {
              postid: post.id,
            },
          });
          return ok({ presignedUrl, postId: post.id });
        }
      } else {
        const { recipientNotOnAppPhoneNumber, recipientNotOnAppName } = params;
        let result: { presignedUrl: string; postId: string } | undefined;

        await this.db.transaction(async (tx) => {
          const recipient = await this.userRepository.getUserByPhoneNumber({
            phoneNumber: recipientNotOnAppPhoneNumber,
          });
          const recipientId = recipient?.id ?? randomUUID();

          if (!recipient) {
            await this.userRepository.createUser(
              {
                id: recipientId,
                phoneNumber: recipientNotOnAppPhoneNumber,
                isOnApp: false,
              },
              tx,
            );

            await this.profileRepository.updateProfile({
              userId: recipientId,
              update: {
                name: recipientNotOnAppName,
                username: recipientNotOnAppName,
              },
            });
          }

          const post = await this.createPost({
            authorUserId: params.authorUserId,
            recipientUserId: recipientId,
            caption: params.caption,
            height: params.height,
            width: params.width,
            mediaType: isVideo ? "video" : "image",
          });

          if (post.isErr()) {
            return err(post.error);
          }

          if (isVideo) {
            result = {
              presignedUrl: await this.mux.getPresignedUrlForVideo({
                postid: post.value.id,
              }),
              postId: post.value.id,
            };
          } else {
            const { contentLength, contentType } =
              params as UploadPostForUserNotOnAppUrlParams;
            const objectKey = `posts/${currentDate}-${recipientId}-${params.authorUserId}.jpg`;
            result = {
              presignedUrl: await this.s3.putObjectPresignedUrl({
                Bucket: env.S3_POST_BUCKET,
                Key: objectKey,
                ContentLength: contentLength,
                ContentType: contentType,
                Metadata: {
                  postid: post.value.id,
                },
              }),
              postId: post.value.id,
            };
          }
        });

        if (!result) {
          return err(new PostErrors.FailedToCreatePost(params.authorUserId));
        }
        return ok(result);
      }
    } catch (error) {
      return err(new PostErrors.FailedToCreatePost(params.authorUserId));
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
  ): Promise<Result<void, PostErrors.PostNotFound | PostErrors.NotPostOwner>> {
    const post = await this.postRepository.getPost({
      postId: params.postId,
      userId: params.userId,
    });

    if (post === undefined) {
      return err(new PostErrors.PostNotFound(params.postId));
    }

    if (post.post.authorUserId !== params.userId) {
      return err(new PostErrors.NotPostOwner(params.userId, params.postId));
    }

    await this.db.transaction(async (tx) => {
      await this.postRepository.deletePost(params, tx);
    });

    return ok();
  }

  async getPost(
    params: GetPostParams,
  ): Promise<
    Result<HydratedPostResult<"withIsLiked">, PostErrors.PostNotFound>
  > {
    const post = await this.postRepository.getPost(params);

    if (post === undefined)
      return err(new PostErrors.PostNotFound(params.postId));

    return ok(this.hydratePost(post));
  }

  async paginatePosts({
    userId,
    cursor,
    pageSize = 20,
  }: PaginatePostsParams): Promise<
    Result<PaginatedResponse<HydratedPostResult<"withIsLiked">>, never>
  > {
    const posts = await this.postRepository.paginatePostsOfUser({
      userId,
      cursor,
      pageSize,
    });
    const hydratedPosts = posts.map((post) => this.hydratePost(post));

    const hasMore = hydratedPosts.length > pageSize;
    const items = hydratedPosts.slice(0, pageSize);
    const lastItem = items[items.length - 1];

    return ok({
      items,
      nextCursor:
        hasMore && lastItem
          ? { id: lastItem.post.id, createdAt: lastItem.post.createdAt }
          : null,
    });
  }

  async paginatePostsForFeed({
    userId,
    cursor,
    pageSize = 10,
  }: PaginatePostsParams): Promise<
    Result<
      PaginatedResponse<HydratedPostResult<"withIsLiked">>,
      PostErrors.PostNotFound
    >
  > {
    const posts = await this.postRepository.paginatePostsOfFollowing({
      userId,
      cursor,
      pageSize,
    });

    const hydratedPosts = posts.map((post) => this.hydratePost(post));

    const hasMore = hydratedPosts.length > pageSize;
    const items = hydratedPosts.slice(0, pageSize);
    const lastItem = items[items.length - 1];

    return ok({
      items,
      nextCursor:
        hasMore && lastItem
          ? { id: lastItem.post.id, createdAt: lastItem.post.createdAt }
          : null,
    });
  }

  async getPostForSite(
    params: GetPostForSiteParams,
  ): Promise<Result<HydratedPostResult, PostErrors.PostNotFound>> {
    const post = await this.postRepository.getPostForSite(params);

    if (post === undefined)
      return err(new PostErrors.PostNotFound(params.postId));

    if (post.recipientProfile.privacy === "private")
      return err(new PostErrors.PostNotFound(params.postId));

    const hydratedPost = this.hydratePost(post);

    return ok(hydratedPost);
  }

  async paginateComments({
    postId,
    cursor,
    pageSize = 10,
  }: PaginateCommentsParams): Promise<
    Result<
      PaginatedResponse<{ comment: Comment; profile: Profile<"onboarded"> }>,
      never
    >
  > {
    const commentsAndProfiles = await this.commentRepository.paginateComments({
      postId,
      cursor,
      pageSize,
    });

    const hydratedCommentsAndProfiles = commentsAndProfiles.map(
      ({ comment, profile }) => ({
        comment,
        profile: this.cloudfront.hydrateProfile(profile),
      }),
    );

    const hasMore = hydratedCommentsAndProfiles.length > pageSize;
    const items = hydratedCommentsAndProfiles.slice(0, pageSize);
    const lastItem = items[items.length - 1];

    return ok({
      items,
      nextCursor:
        hasMore && lastItem
          ? { id: lastItem.comment.id, createdAt: lastItem.comment.createdAt }
          : null,
    });
  }

  private hydratePost<T extends "withIsLiked" | "withoutIsLiked" | undefined>(
    post: PostResult<T>,
  ): HydratedPostResult<T> {
    return {
      ...post,
      post: this.cloudfront.hydratePost(post.post),
      authorProfile: this.cloudfront.hydrateProfile(post.authorProfile),
      recipientProfile: this.cloudfront.hydrateProfile(post.recipientProfile),
    };
  }
}

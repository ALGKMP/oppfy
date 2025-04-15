import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront, Hydrate } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";
import { env } from "@oppfy/env";
import { Mux } from "@oppfy/mux";
import { S3 } from "@oppfy/s3";

import * as PostErrors from "../../errors/content/post.error";
import type {
  PaginatedResponse,
  PaginationParams,
} from "../../interfaces/types";
import { Comment, Post, PostStats, Profile } from "../../models";
import { CommentRepository } from "../../repositories/content/comment.repository";
import type { PaginatedCommentResult as RawPaginatedComment } from "../../repositories/content/comment.repository";
import {
  PostRepository,
  PostResult,
} from "../../repositories/content/post.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { UserRepository } from "../../repositories/user/user.repository";
import { TYPES } from "../../symbols";

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

  // Hydration function for PostResult
  private hydrateAndProcessPost(raw: RawPostResult): HydratedAndProcessedPost {
    const hydratedPost = this.cloudfront.hydratePost(raw.post);
    const hydratedAuthorProfile = this.cloudfront.hydrateProfile(
      raw.authorProfile,
    );
    const hydratedRecipientProfile = this.cloudfront.hydrateProfile(
      raw.recipientProfile,
    );

    return {
      post: hydratedPost,
      assetUrl: hydratedPost.postUrl,
      postStats: raw.postStats,
      authorUserId: raw.authorProfile.userId,
      authorUsername: raw.authorProfile.username ?? "",
      authorName: raw.authorProfile.name ?? null,
      authorProfilePictureUrl: hydratedAuthorProfile.profilePictureUrl,
      recipientUserId: raw.recipientProfile.userId,
      recipientUsername: raw.recipientProfile.username ?? "",
      recipientName: raw.recipientProfile.name ?? null,
      recipientProfilePictureUrl: hydratedRecipientProfile.profilePictureUrl,
      hasLiked: !!raw.like,
    };
  }

  // Hydration function for PostResultWithoutLike
  private hydrateAndProcessPostResultWithoutLike(
    raw: RawPostResultWithoutLike,
  ): HydratedAndProcessedPostWithoutLike {
    const hydratedPost = this.cloudfront.hydratePost(raw.post);
    const hydratedAuthorProfile = this.cloudfront.hydrateProfile(
      raw.authorProfile,
    );
    const hydratedRecipientProfile = this.cloudfront.hydrateProfile(
      raw.recipientProfile,
    );

    return {
      post: hydratedPost,
      assetUrl: hydratedPost.postUrl,
      postStats: raw.postStats,
      authorUserId: raw.authorProfile.userId,
      authorUsername: raw.authorProfile.username ?? "",
      authorName: raw.authorProfile.name ?? null,
      authorProfilePictureUrl: hydratedAuthorProfile.profilePictureUrl,
      recipientUserId: raw.recipientProfile.userId,
      recipientUsername: raw.recipientProfile.username ?? "",
      recipientName: raw.recipientProfile.name ?? null,
      recipientProfilePictureUrl: hydratedRecipientProfile.profilePictureUrl,
    };
  }

  // Hydration function for PaginatedComment
  private hydrateAndProcessComment(
    raw: RawPaginatedComment,
  ): HydratedAndProcessedComment {
    const hydratedProfile = this.cloudfront.hydrateProfile(raw.profile);
    return {
      comment: raw.comment,
      authorUserId: raw.profile.userId,
      authorUsername: raw.profile.username ?? "",
      authorName: raw.profile.name ?? null,
      authorProfilePictureUrl: hydratedProfile.profilePictureUrl,
    };
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
    try {
      await this.db.transaction(async (tx) => {
        const post = await this.postRepository.getPost(
          { postId: params.postId, userId: params.userId },
          tx,
        );
        if (!post) throw new PostErrors.PostNotFound(params.postId);
        if (post.post.authorUserId !== params.userId)
          throw new PostErrors.NotPostOwner(params.userId, params.postId);
        await this.postRepository.deletePost(params, tx);
      });
      return ok();
    } catch (error) {
      if (
        error instanceof PostErrors.PostNotFound ||
        error instanceof PostErrors.NotPostOwner
      ) {
        return err(error);
      }
      throw error; // Unexpected errors bubble up
    }
  }

  async getPost(
    params: GetPostParams,
  ): Promise<Result<HydratedAndProcessedPost, PostErrors.PostNotFound>> {
    const rawPost = await this.postRepository.getPost(params);
    if (!rawPost) return err(new PostErrors.PostNotFound(params.postId));
    return ok(this.hydrateAndProcessPost(rawPost));
  }

  async paginatePosts({
    userId,
    cursor,
    pageSize = 20,
  }: PaginatePostsParams): Promise<
    Result<PaginatedResponse<HydratedAndProcessedPost>, never>
  > {
    const rawPosts = await this.postRepository.paginatePostsOfUser({
      userId,
      cursor,
      pageSize,
    });
    const hydratedPosts = rawPosts.map((post) =>
      this.hydrateAndProcessPost(post),
    );
    const lastPost = hydratedPosts[pageSize - 1];

    return ok({
      items: hydratedPosts.slice(0, pageSize),
      nextCursor:
        rawPosts.length > pageSize && lastPost
          ? {
              id: lastPost.post.id,
              createdAt: lastPost.post.createdAt,
            }
          : null,
    });
  }

  async paginatePostsForFeed({
    userId,
    cursor,
    pageSize = 10,
  }: PaginatePostsParams): Promise<
    Result<PaginatedResponse<HydratedAndProcessedPost>, PostErrors.PostNotFound>
  > {
    const rawPosts = await this.postRepository.paginatePostsOfFollowing({
      userId,
      cursor,
      pageSize,
    });
    if (!rawPosts.length && cursor)
      return err(new PostErrors.PostNotFound(cursor.id));

    const hydratedPosts = rawPosts.map((post) =>
      this.hydrateAndProcessPost(post),
    );
    const lastPost = hydratedPosts[pageSize - 1];

    // TODO: userId not returned here anymore (Might die from react query)
    return ok({
      items: hydratedPosts.slice(0, pageSize),
      nextCursor:
        rawPosts.length > pageSize && lastPost
          ? {
              id: lastPost.post.id,
              createdAt: lastPost.post.createdAt,
            }
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

  private hydratePost(post: PostResult): HydratedPostResult {
    return {
      ...post,
      post: this.cloudfront.hydratePost(post.post),
      authorProfile: this.cloudfront.hydrateProfile(post.authorProfile),
      recipientProfile: this.cloudfront.hydrateProfile(post.recipientProfile),
    };
  }
}

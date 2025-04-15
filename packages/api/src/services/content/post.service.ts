import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront, Hydrate } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";
import { Mux } from "@oppfy/mux";
import { ImageContentType, S3 } from "@oppfy/s3";

import * as PostErrors from "../../errors/content/post.error";
import { Comment, Post, PostStats, Profile } from "../../models";
import { CommentRepository } from "../../repositories/content/comment.repository";
import {
  PostRepository,
  PostResult,
} from "../../repositories/content/post.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { UserRepository } from "../../repositories/user/user.repository";
import { TYPES } from "../../symbols";
import type { PaginatedResponse, PaginationParams } from "../../types";

interface BasePostParams {
  authorUserId: string;
  caption: string;
  height: number;
  width: number;
}

interface BaseImagePostParams extends BasePostParams {
  contentLength: number;
  contentType: ImageContentType;
}

interface BaseUserOnAppParams {
  recipientUserId: string;
}

interface BaseUserNotOnAppParams {
  recipientNotOnAppPhoneNumber: string;
  recipientNotOnAppName: string;
}

interface GetPostParams {
  postId: string;
  userId: string;
}

interface GetPostForSiteParams {
  postId: string;
}

interface DeletePostParams {
  userId: string;
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

  async uploadImagePostForUserOnApp(
    params: BaseImagePostParams & BaseUserOnAppParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, never>> {
    return ok(await this.uploadImagePost(params));
  }

  async uploadImagePostForUserNotOnApp(
    params: BaseImagePostParams & BaseUserNotOnAppParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, never>> {
    return await this.db.transaction(async (tx) => {
      const recipientUser = await this.userRepository.getUserByPhoneNumber({
        phoneNumber: params.recipientNotOnAppPhoneNumber,
      });

      if (recipientUser) {
        return ok(
          await this.uploadImagePost({
            ...params,
            recipientUserId: recipientUser.id,
          }),
        );
      }

      const { user: createdRecipientUser } =
        await this.userRepository.createUser(
          {
            phoneNumber: params.recipientNotOnAppPhoneNumber,
            isOnApp: false,
          },
          tx,
        );

      await this.profileRepository.updateProfile(
        {
          userId: createdRecipientUser.id,
          update: {
            name: params.recipientNotOnAppName,
            username: `${params.recipientNotOnAppName}-${Math.random().toString(36).substring(2, 15)}`,
          },
        },
        tx,
      );

      return ok(
        await this.uploadImagePost({
          ...params,
          recipientUserId: createdRecipientUser.id,
        }),
      );
    });
  }

  async uploadVideoPostForUserOnApp(
    params: BasePostParams & BaseUserOnAppParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, never>> {
    return ok(await this.uploadVideoPost(params));
  }

  async uploadVideoPostForUserNotOnApp(
    params: BasePostParams & BaseUserNotOnAppParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, never>> {
    return await this.db.transaction(async (tx) => {
      const recipientUser = await this.userRepository.getUserByPhoneNumber({
        phoneNumber: params.recipientNotOnAppPhoneNumber,
      });

      if (recipientUser) {
        return ok(
          await this.uploadVideoPost({
            ...params,
            recipientUserId: recipientUser.id,
          }),
        );
      }

      const { user: createdRecipientUser } =
        await this.userRepository.createUser(
          {
            phoneNumber: params.recipientNotOnAppPhoneNumber,
            isOnApp: false,
          },
          tx,
        );

      await this.profileRepository.updateProfile(
        {
          userId: createdRecipientUser.id,
          update: {
            name: params.recipientNotOnAppName,
            username: `${params.recipientNotOnAppName}-${Math.random().toString(36).substring(2, 15)}`,
          },
        },
        tx,
      );

      return ok(
        await this.uploadVideoPost({
          ...params,
          recipientUserId: createdRecipientUser.id,
        }),
      );
    });
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

  private async uploadImagePost(
    params: BaseImagePostParams & BaseUserOnAppParams,
  ): Promise<{ presignedUrl: string; postId: string }> {
    return await this.db.transaction(async (tx) => {
      const key = `posts/${Date.now()}-${params.recipientUserId}-${params.authorUserId}.jpg`;

      const { post } = await this.postRepository.createPost(
        {
          ...params,
          postKey: key,
          mediaType: "image",
        },
        tx,
      );

      const presignedUrl = await this.s3.createPostPresignedUrl({
        key,
        contentLength: params.contentLength,
        contentType: params.contentType,
        metadata: {
          postid: post.id,
        },
      });

      return { presignedUrl, postId: post.id };
    });
  }

  private async uploadVideoPost(
    params: BasePostParams & BaseUserOnAppParams,
  ): Promise<{ presignedUrl: string; postId: string }> {
    return await this.db.transaction(async (tx) => {
      const key = `processing`;

      const { post } = await this.postRepository.createPost(
        {
          ...params,
          postKey: key,
          mediaType: "image",
        },
        tx,
      );

      const presignedUrl = await this.mux.getPresignedUrlForVideo({
        metadata: {
          postid: post.id,
        },
      });

      return { presignedUrl, postId: post.id };
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

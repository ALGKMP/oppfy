import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront } from "@oppfy/cloudfront";
import type { Database, Transaction } from "@oppfy/db";
import { Mux } from "@oppfy/mux";
import { ImageContentType, S3 } from "@oppfy/s3";

import * as PostErrors from "../../errors/content/post.error";
import { Comment, Post, PostStats, Profile } from "../../models";
import { CommentRepository } from "../../repositories/content/comment.repository";
import {
  PostRepository,
  PostResult,
} from "../../repositories/content/post.repository";
import { FriendRepository } from "../../repositories/social/friend.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { UserRepository } from "../../repositories/user/user.repository";
import { TYPES } from "../../symbols";
import type { PaginatedResponse, PaginationParams } from "../../types";
import { Hydrate, hydratePost, hydrateProfile } from "../../utils";

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
  userId: string;
  postId: string;
}

interface GetIsLikedParams {
  userId: string;
  postId: string;
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
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: FriendRepository,
    @inject(TYPES.CommentRepository)
    private readonly commentRepository: CommentRepository,
    @inject(TYPES.S3)
    private readonly s3: S3,
    @inject(TYPES.CloudFront)
    private readonly cloudfront: CloudFront,
    @inject(TYPES.Mux)
    private readonly mux: Mux,
  ) {}

  async getPostStats(
    params: GetPostParams,
  ): Promise<Result<PostStats, PostErrors.PostNotFound>> {
    const post = await this.postRepository.getPost(params);

    if (post === undefined)
      return err(new PostErrors.PostNotFound(params.postId));

    return ok(post.postStats);
  }

  async getIsLiked(
    params: GetIsLikedParams,
  ): Promise<Result<boolean, PostErrors.PostNotFound>> {
    const post = await this.postRepository.getPost(params);

    if (post === undefined)
      return err(new PostErrors.PostNotFound(params.postId));

    return ok(post.isLiked);
  }

  async getPost(
    params: GetPostParams,
  ): Promise<
    Result<HydratedPostResult<"withIsLiked">, PostErrors.PostNotFound>
  > {
    const post = await this.postRepository.getPost(params);

    if (post === undefined)
      return err(new PostErrors.PostNotFound(params.postId));

    return ok(await this.hydratePost(post));
  }

  async getPostForSite(
    params: GetPostForSiteParams,
  ): Promise<Result<HydratedPostResult, PostErrors.PostNotFound>> {
    const post = await this.postRepository.getPostForSite(params);

    if (post === undefined)
      return err(new PostErrors.PostNotFound(params.postId));

    if (post.recipientProfile.privacy === "private")
      return err(new PostErrors.PostNotFound(params.postId));

    return ok(await this.hydratePost(post));
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

    if (post.post.recipientUserId !== params.userId) {
      return err(new PostErrors.NotPostOwner(params.userId, params.postId));
    }

    // TODO: we should delete the actual post from s3/mux
    await this.db.transaction(async (tx) => {
      await this.postRepository.deletePost(params, tx);
    });

    return ok();
  }

  async uploadImagePostForUserOnApp(
    params: BaseImagePostParams & BaseUserOnAppParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, never>> {
    return ok(await this.uploadImagePost(params));
  }

  async uploadImagePostForUserNotOnApp(
    params: BaseImagePostParams & BaseUserNotOnAppParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, never>> {
    const recipientUser = await this.db.transaction(async (tx) => {
      const recipientUser = await this.userRepository.getUserByPhoneNumber({
        phoneNumber: params.recipientNotOnAppPhoneNumber,
      });

      if (recipientUser) {
        return recipientUser;
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
            // 5 extra random characters to avoid collisions
            username: `${params.recipientNotOnAppName}-${Math.random().toString(36).substring(2, 7)}`,
          },
        },
        tx,
      );

      return createdRecipientUser;
    });

    return ok(
      await this.uploadImagePost({
        ...params,
        recipientUserId: recipientUser.id,
      }),
    );
  }

  async uploadVideoPostForUserOnApp(
    params: BasePostParams & BaseUserOnAppParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, never>> {
    return ok(await this.uploadVideoPost(params));
  }

  async uploadVideoPostForUserNotOnApp(
    params: BasePostParams & BaseUserNotOnAppParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, never>> {
    const recipientUser = await this.db.transaction(async (tx) => {
      const recipientUser = await this.userRepository.getUserByPhoneNumber({
        phoneNumber: params.recipientNotOnAppPhoneNumber,
      });

      if (recipientUser) {
        return recipientUser;
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
            // 5 extra random characters to avoid collisions
            username: `${params.recipientNotOnAppName}-${Math.random().toString(36).substring(2, 7)}`,
          },
        },
        tx,
      );

      return createdRecipientUser;
    });

    return ok(
      await this.uploadVideoPost({
        ...params,
        recipientUserId: recipientUser.id,
      }),
    );
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
    const hydratedPosts = await Promise.all(
      posts.map((post) => this.hydratePost(post)),
    );

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

    const hydratedPosts = await Promise.all(
      posts.map((post) => this.hydratePost(post)),
    );

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

  async paginateComments({
    postId,
    cursor,
    pageSize = 10,
  }: PaginateCommentsParams): Promise<
    Result<
      PaginatedResponse<{
        comment: Comment;
        profile: Hydrate<Profile<"onboarded">>;
      }>,
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
        profile: hydrateProfile(profile),
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

      // Update friend streak data with validation
      await this.updateFriendStreak(
        {
          authorUserId: params.authorUserId,
          recipientUserId: params.recipientUserId,
          postId: post.id,
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
          mediaType: "video",
        },
        tx,
      );

      // Update friend streak data with validation
      await this.updateFriendStreak(
        {
          authorUserId: params.authorUserId,
          recipientUserId: params.recipientUserId,
          postId: post.id,
        },
        tx,
      );

      const presignedUrl = await this.mux.getPresignedUrlForVideoUpload({
        metadata: {
          postid: post.id,
        },
      });

      return { presignedUrl, postId: post.id };
    });
  }

  private async hydratePost<
    T extends "withIsLiked" | "withoutIsLiked" | undefined,
  >(post: PostResult<T>): Promise<HydratedPostResult<T>> {
    return {
      ...post,
      post: await hydratePost(post.post),
      authorProfile: hydrateProfile(post.authorProfile),
      recipientProfile: hydrateProfile(post.recipientProfile),
    };
  }

  private async updateFriendStreak(
    params: {
      authorUserId: string;
      recipientUserId: string;
      postId: string;
    },
    tx: Transaction,
  ): Promise<{
    streakIncremented: boolean;
    currentStreak: number;
    longestStreak: number;
    resetReason?:
      | "same_author"
      | "too_soon"
      | "no_previous_post"
      | "friendship_not_found";
  }> {
    // Get current friendship data
    const friend = await this.friendRepository.getFriend(
      {
        userIdA: params.authorUserId,
        userIdB: params.recipientUserId,
      },
      tx,
    );

    if (!friend) {
      // No friendship exists - this shouldn't happen in normal flow
      console.warn(
        `No friendship found between users ${params.authorUserId} and ${params.recipientUserId}`,
      );
      return {
        streakIncremented: false,
        currentStreak: 0,
        longestStreak: 0,
        resetReason: "friendship_not_found",
      };
    }

    // Business logic: Determine streak behavior
    const currentDate = new Date();
    let newCurrentStreak = friend.currentStreak;
    let streakIncremented = false;
    let resetReason:
      | "same_author"
      | "too_soon"
      | "no_previous_post"
      | undefined;

    // Business rule: Check if this is the first post in the friendship
    if (!friend.lastPostDate || !friend.lastPostAuthorId) {
      newCurrentStreak = 1;
      resetReason = "no_previous_post";
    } else {
      // Business rule: Calculate time since last post
      const hoursSinceLastPost =
        (currentDate.getTime() - friend.lastPostDate.getTime()) /
        (1000 * 60 * 60);

      // Business rule: Check if last author was different
      const lastAuthorWasDifferent =
        friend.lastPostAuthorId !== params.authorUserId;

      // Business rule: Check if enough time has passed (24 hours)
      const enoughTimeHasPassed = hoursSinceLastPost >= 24;

      if (!lastAuthorWasDifferent) {
        // Business rule: Same author posted consecutively - reset streak
        newCurrentStreak = 1;
        resetReason = "same_author";
      } else if (!enoughTimeHasPassed) {
        // Business rule: Not enough time has passed - reset streak
        newCurrentStreak = 1;
        resetReason = "too_soon";
      } else {
        // Business rule: Valid conditions met - increment streak
        newCurrentStreak = friend.currentStreak + 1;
        streakIncremented = true;
      }
    }

    // Business rule: Update longest streak if current exceeds it
    const newLongestStreak = Math.max(newCurrentStreak, friend.longestStreak);

    // Data access: Update the database
    await this.friendRepository.updateFriendStreakFields(
      {
        userIdA: params.authorUserId,
        userIdB: params.recipientUserId,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastPostDate: currentDate,
        lastPostAuthorId: params.authorUserId,
        lastPostRecipientId: params.recipientUserId,
        lastPostId: params.postId,
      },
      tx,
    );

    const result = {
      streakIncremented,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      resetReason,
    };

    // Business logic: Logging and analytics
    if (resetReason) {
      console.log(
        `Streak reset for users ${params.authorUserId} <-> ${params.recipientUserId}:`,
        {
          reason: resetReason,
          newStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          ...(resetReason === "too_soon" && {
            hoursSinceLastPost:
              (currentDate.getTime() - friend.lastPostDate!.getTime()) /
              (1000 * 60 * 60),
          }),
        },
      );
    } else if (streakIncremented) {
      console.log(
        `Streak incremented for users ${params.authorUserId} <-> ${params.recipientUserId}:`,
        {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
        },
      );
    }

    return result;
  }
}

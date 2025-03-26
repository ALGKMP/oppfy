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
import type { ICommentRepository } from "../../interfaces/repositories/content/comment.repository.interface";
import type {
  IPostRepository,
  PostResult as RawPostResult,
  PostResultWithoutLike as RawPostResultWithoutLike,
} from "../../interfaces/repositories/content/post.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  CommentCursor,
  DeletePostParams,
  FeedCursor,
  GetPostForNextJsParams,
  GetPostParams,
  HydratedAndProcessedComment,
  HydratedAndProcessedPost,
  HydratedAndProcessedPostWithoutLike,
  IPostService,
  PaginateCommentsParams,
  PaginatedResponse,
  PaginatePostsForFeedParams,
  PaginatePostsParams,
  PostCursor,
  PaginatedComment as RawPaginatedComment,
  UpdatePostParams,
  UploadPostForUserNotOnAppUrlParams,
  UploadPostForUserOnAppUrlParams,
  UploadVideoPostForUserNotOnAppUrlParams,
  UploadVideoPostForUserOnAppUrlParams,
} from "../../interfaces/services/content/post.service.interface";

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
    @inject(TYPES.CommentRepository)
    private readonly commentRepository: ICommentRepository,
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
            { author, recipient, caption, height, width, postid: postId },
          );
          return ok({ presignedUrl, postId });
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

  // Hydration function for PostResult
  private hydratePostResult(raw: RawPostResult): HydratedAndProcessedPost {
    const hydratedPost = cloudfront.hydratePost(raw.post);
    const hydratedAuthorProfile = cloudfront.hydrateProfile(raw.authorProfile);
    const hydratedRecipientProfile = cloudfront.hydrateProfile(
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
  private hydratePostResultWithoutLike(
    raw: RawPostResultWithoutLike,
  ): HydratedAndProcessedPostWithoutLike {
    const hydratedPost = cloudfront.hydratePost(raw.post);
    const hydratedAuthorProfile = cloudfront.hydrateProfile(raw.authorProfile);
    const hydratedRecipientProfile = cloudfront.hydrateProfile(
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
  private hydrateComment(
    raw: RawPaginatedComment,
  ): HydratedAndProcessedComment {
    const hydratedProfile = cloudfront.hydrateProfile(raw.profile);
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
      return ok(undefined);
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
    return ok(this.hydratePostResult(rawPost));
  }

  async paginatePosts({
    userId,
    cursor,
    pageSize = 20,
  }: PaginatePostsParams): Promise<
    Result<PaginatedResponse<HydratedAndProcessedPost, PostCursor>, never>
  > {
    const rawPosts = await this.postRepository.paginatePostsOfUser({
      userId,
      cursor,
      pageSize,
    });
    const hydratedPosts = rawPosts.map((post) => this.hydratePostResult(post));
    const lastPost = hydratedPosts[pageSize - 1];

    return ok({
      items: hydratedPosts.slice(0, pageSize),
      nextCursor:
        rawPosts.length > pageSize && lastPost
          ? {
              postId: lastPost.post.id,
              createdAt: lastPost.post.createdAt,
            }
          : null,
    });
  }

  async paginatePostsForFeed({
    userId,
    cursor,
    pageSize,
  }: PaginatePostsForFeedParams): Promise<
    Result<
      PaginatedResponse<HydratedAndProcessedPost, FeedCursor>,
      PostErrors.PostNotFound
    >
  > {
    const rawPosts = await this.postRepository.paginatePostsOfFollowing({
      userId,
      cursor,
      pageSize,
    });
    if (!rawPosts.length && cursor)
      return err(new PostErrors.PostNotFound(cursor.postId));

    const hydratedPosts = rawPosts.map((post) => this.hydratePostResult(post));
    const lastPost = hydratedPosts[pageSize - 1];

    return ok({
      items: hydratedPosts.slice(0, pageSize),
      nextCursor:
        rawPosts.length > pageSize && lastPost
          ? {
              postId: lastPost.post.id,
              createdAt: lastPost.post.createdAt,
              type: "following", // Only "following" for now; extend for "recommended" later
            }
          : null,
    });
  }

  async getPostForNextJs(
    params: GetPostForNextJsParams,
  ): Promise<
    Result<HydratedAndProcessedPostWithoutLike, PostErrors.PostNotFound>
  > {
    const rawPost = await this.postRepository.getPostForNextJs(params);
    if (!rawPost) return err(new PostErrors.PostNotFound(params.postId));

    const profile = await this.profileRepository.getProfile({
      userId: rawPost.post.authorUserId,
    });
    if (!profile || profile.privacy !== "public") {
      return err(new PostErrors.PostNotFound(params.postId));
    }

    return ok(this.hydratePostResultWithoutLike(rawPost));
  }

  async updatePost({
    userId,
    postId,
    content: caption,
  }: UpdatePostParams): Promise<
    Result<
      void,
      | PostErrors.FailedToUpdatePost
      | PostErrors.PostNotFound
      | PostErrors.NotPostOwner
    >
  > {
    try {
      await this.db.transaction(async (tx) => {
        const post = await this.postRepository.getPost({ postId, userId }, tx);
        if (!post) throw new PostErrors.PostNotFound(postId);
        if (post.post.authorUserId !== userId) {
          throw new PostErrors.NotPostOwner(userId, postId);
        }
        await this.postRepository.updatePost({ postId, caption }, tx);
      });
      return ok(undefined);
    } catch (error) {
      if (
        error instanceof PostErrors.PostNotFound ||
        error instanceof PostErrors.NotPostOwner
      ) {
        return err(error);
      }
      return err(new PostErrors.FailedToUpdatePost(postId));
    }
  }

  async paginateComments({
    postId,
    cursor,
    pageSize = 10,
  }: PaginateCommentsParams): Promise<
    Result<PaginatedResponse<HydratedAndProcessedComment, CommentCursor>, never>
  > {
    const rawComments = await this.commentRepository.paginateComments({
      postId,
      cursor,
      pageSize,
    });
    const hydratedComments = rawComments.map((comment) =>
      this.hydrateComment(comment),
    );
    const lastComment = hydratedComments[pageSize - 1];

    return ok({
      items: hydratedComments.slice(0, pageSize),
      nextCursor:
        rawComments.length > pageSize && lastComment
          ? {
              commentId: lastComment.comment.id,
              createdAt: lastComment.comment.createdAt,
            }
          : null,
    });
  }
}

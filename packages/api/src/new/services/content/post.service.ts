import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database, InferSelectModel, schema } from "@oppfy/db";
import { env } from "@oppfy/env";
import { mux } from "@oppfy/mux";
import { s3 } from "@oppfy/s3";
import { cloudfront } from "@oppfy/cloudfront"; // Adjust path as needed

import { TYPES } from "../../container";
import { PostErrors } from "../../errors/content/post.error";
import type { IPostRepository } from "../../interfaces/repositories/content/postRepository.interface";
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
import type { Post } from "../../models";
type RepositoryPost = InferSelectModel<typeof schema.post> & {
  authorUsername: string;
  authorProfileId: string;
  authorProfilePicture: string | null;
  authorName: string | null;
  recipientUsername: string;
  recipientProfileId: string;
  recipientProfilePicture: string | null;
  recipientName: string | null;
  commentsCount: number;
  likesCount: number;
  hasLiked?: boolean;
};

@injectable()
export class PostService implements IPostService {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.PostRepository) private readonly postRepository: IPostRepository,
    @inject(TYPES.UserRepository) private readonly userRepository: IUserRepository,
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

  private transformPost(post: RepositoryPost): Post {
    const hydratedPost = cloudfront.hydratePost(post);
    return hydratedPost;
  }

  private async handleUpload(
    params: UploadPostForUserOnAppUrlParams | UploadPostForUserNotOnAppUrlParams | UploadVideoPostForUserOnAppUrlParams | UploadVideoPostForUserNotOnAppUrlParams,
    isVideo: boolean,
  ): Promise<Result<{ presignedUrl: string; postId: string }, PostErrors.FailedToCreatePost>> {
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
          const { contentLength, contentType } = params as UploadPostForUserOnAppUrlParams;
          const objectKey = `posts/${currentDate}-${recipient}-${author}.jpg`;
          const presignedUrl = await this.generatePresignedUrl(objectKey, contentLength, contentType, {
            author,
            recipient,
            caption,
            height,
            width,
            postid: postId,
          });
          return ok({ presignedUrl, postId });
        }
      } else {
        // Not-on-app user cases
        const { recipientNotOnAppPhoneNumber, recipientNotOnAppName } = params;
        let result: { presignedUrl: string; postId: string } | undefined;

        await this.db.transaction(async (tx) => {
          const recipient = await this.userRepository.getUserByPhoneNumber({ phoneNumber: recipientNotOnAppPhoneNumber });
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
            const { contentLength, contentType } = params as UploadPostForUserNotOnAppUrlParams;
            const objectKey = `posts/${currentDate}-${recipientId}-${author}.jpg`;
            result = {
              presignedUrl: await this.generatePresignedUrl(objectKey, contentLength, contentType, {
                author,
                caption,
                height,
                width,
                recipient: recipientId,
                postid: postId,
              }),
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
  ): Promise<Result<{ presignedUrl: string; postId: string }, PostErrors.FailedToCreatePost>> {
    return this.handleUpload(params, false);
  }

  async uploadPostForUserNotOnAppUrl(
    params: UploadPostForUserNotOnAppUrlParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, PostErrors.FailedToCreatePost>> {
    return this.handleUpload(params, false);
  }

  async uploadVideoPostForUserOnAppUrl(
    params: UploadVideoPostForUserOnAppUrlParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, PostErrors.FailedToCreatePost>> {
    return this.handleUpload(params, true);
  }

  async uploadVideoPostForUserNotOnAppUrl(
    params: UploadVideoPostForUserNotOnAppUrlParams,
  ): Promise<Result<{ presignedUrl: string; postId: string }, PostErrors.FailedToCreatePost>> {
    return this.handleUpload(params, true);
  }

  async deletePost(
    params: DeletePostParams,
  ): Promise<
    Result<
      void,
      PostErrors.FailedToDeletePost | PostErrors.PostNotFound | PostErrors.NotPostOwner | PostErrors.PostDeleted
    >
  > {
    try {
      await this.db.transaction(async (tx) => {
        await this.postRepository.deletePost(params, tx);
      });
      return ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) return err(new PostErrors.PostNotFound(params.postId));
        if (error.message.includes("Unauthorized")) return err(new PostErrors.NotPostOwner(params.postId, params.userId));
        if (error.message.includes("deleted")) return err(new PostErrors.PostDeleted(params.postId));
      }
      return err(new PostErrors.FailedToDeletePost(params.postId));
    }
  }

  async getPost(
    params: GetPostParams,
  ): Promise<Result<Post, PostErrors.PostNotFound | PostErrors.PostDeleted>> {
    const post = await this.postRepository.getPost(params);
    if (!post) return err(new PostErrors.PostNotFound(params.postId));
    return ok(this.transformPost(post));
  }

  async paginatePosts(
    params: PaginatePostsParams,
  ): Promise<Result<PaginatedResponse<Post, PostCursor>, never>> {
    const { userId, cursor, pageSize = 20 } = params;
    const posts = await this.postRepository.paginatePostsOfUser({ userId, cursor: cursor ?? undefined, pageSize });
    const hydratedPosts = cloudfront.hydratePosts(posts.map(p => ({
      id: p.id,
      authorUserId: p.authorUserId,
      recipientUserId: p.recipientUserId,
      caption: p.caption,
      key: p.key,
      width: p.width,
      height: p.height,
      mediaType: p.mediaType,
      postType: p.postType,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })));

    return ok({
      items: hydratedPosts.map(hp => ({
        ...hp,
        authorUserId: hp.authorUserId,
        recipientUserId: hp.recipientUserId,
      })),
      nextCursor: posts.length > pageSize ? {
        postId: posts[posts.length - 1].id,
        createdAt: posts[posts.length - 1].createdAt,
      } : null,
    });
  }

  async paginatePostsForFeed(
    params: PaginatePostsForFeedParams,
  ): Promise<Result<PaginatedResponse<Post, FeedCursor>, PostErrors.PostNotFound>> {
    const { userId, cursor, pageSize } = params;
    const posts = await this.postRepository.paginatePostsOfFollowing({ userId, cursor: cursor ?? undefined, pageSize });
    if (!posts.length && cursor) return err(new PostErrors.PostNotFound(cursor.postId));

    const hydratedPosts = cloudfront.hydratePosts(posts.map(p => ({
      id: p.id,
      authorUserId: p.authorUserId,
      recipientUserId: p.recipientUserId,
      caption: p.caption,
      key: p.key,
      width: p.width,
      height: p.height,
      mediaType: p.mediaType,
      postType: p.postType,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })));

    return ok({
      items: hydratedPosts.map(hp => ({
        ...hp,
        authorUserId: hp.authorUserId,
        recipientUserId: hp.recipientUserId,
      })),
      nextCursor: posts.length > pageSize ? {
        postId: posts[posts.length - 1].id,
        createdAt: posts[posts.length - 1].createdAt,
        type: "following", // Assuming only following feed for now; extend for "recommended" if needed
      } : null,
    });
  }

  async getPostForNextJs(
    params: GetPostForNextJsParams,
  ): Promise<Result<Omit<Post, "hasLiked">, PostErrors.PostNotFound>> {
    const post = await this.postRepository.getPostForNextJs(params);
    if (!post) return err(new PostErrors.PostNotFound(params.postId));

    const user = await this.userRepository.getUserWithProfile({ userId: post.authorUserId });
    if (!user || user.profile.privacy !== "public") {
      return err(new PostErrors.PostNotFound(params.postId));
    }

    const transformedPost = this.transformPost(post);
    const { hasLiked, ...postWithoutHasLiked } = transformedPost;
    return ok(postWithoutHasLiked);
  }

  // Note: UpdatePostParams is defined but not implemented in IPostService; adding it here for completeness
  async updatePost(
    params: UpdatePostParams,
  ): Promise<Result<void, PostErrors.FailedToUpdatePost | PostErrors.PostNotFound | PostErrors.NotPostOwner>> {
    const { userId, postId, content: caption } = params; // Assuming content maps to caption
    try {
      await this.db.transaction(async (tx) => {
        const post = await tx.query.post.findFirst({
          where: eq(this.schema.post.id, postId),
          columns: { authorUserId: true },
        });

        if (!post) throw new Error("Post not found");
        if (post.authorUserId !== userId) throw new Error("Unauthorized: User does not own this post");

        await this.postRepository.updatePost({ postId, caption }, tx);
      });
      return ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) return err(new PostErrors.PostNotFound(postId));
        if (error.message.includes("Unauthorized")) return err(new PostErrors.NotPostOwner(userId));
      }
      return err(new PostErrors.FailedToUpdatePost(postId));
    }
  }
}
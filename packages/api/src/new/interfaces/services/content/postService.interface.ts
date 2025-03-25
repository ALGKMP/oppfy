import type { Result } from "neverthrow";

import type { Schema } from "@oppfy/db";

import type { PostErrors } from "../../../errors/content/post.error";

import type { Post } from "../../../models";

export interface PaginatedResponse<TItem, TCursor> {
  items: TItem[];
  nextCursor: TCursor | null;
}

export type PostStats = Schema["postStats"]["$inferSelect"];

export interface BaseCursor {
  createdAt: Date;
}

export interface PostCursor extends BaseCursor {
  postId: string;
}

export interface FeedCursor extends BaseCursor {
  postId: string;
  type: "following" | "recommended";
}

export interface UploadPostForUserOnAppUrlParams {
  author: string;
  recipient: string;
  caption: string;
  height: string;
  width: string;
  contentLength: number;
  contentType: "image/jpeg" | "image/png" | "image/heic";
}

export interface UploadPostForUserNotOnAppUrlParams {
  author: string;
  recipientNotOnAppPhoneNumber: string;
  recipientNotOnAppName: string;
  caption: string;
  height: string;
  width: string;
  contentLength: number;
  contentType: "image/jpeg" | "image/png" | "image/heic";
}

export interface UploadVideoPostForUserOnAppUrlParams {
  author: string;
  recipient: string;
  caption: string;
  height: string;
  width: string;
}

export interface UploadVideoPostForUserNotOnAppUrlParams {
  author: string;
  recipientNotOnAppPhoneNumber: string;
  recipientNotOnAppName: string;
  caption: string;
  height: string;
  width: string;
}

export interface UpdatePostParams {
  userId: string;
  postId: string;
  content: string;
  mediaUrls?: string[];
}

export interface DeletePostParams {
  userId: string;
  postId: string;
}

export interface GetPostParams {
  postId: string;
  userId: string;
}

export interface GetPostForNextJsParams {
  postId: string;
}

export interface PaginatePostsParams {
  userId: string;
  cursor: PostCursor | null;
  pageSize?: number;
}

export interface PaginatePostsForFeedParams {
  userId: string;
  cursor: FeedCursor | null;
  pageSize: number;
}

export interface IPostService {
  uploadPostForUserOnAppUrl(
    params: UploadPostForUserOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  >;

  uploadPostForUserNotOnAppUrl(
    params: UploadPostForUserNotOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  >;

  uploadVideoPostForUserOnAppUrl(
    params: UploadVideoPostForUserOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  >;

  uploadVideoPostForUserNotOnAppUrl(
    params: UploadVideoPostForUserNotOnAppUrlParams,
  ): Promise<
    Result<
      { presignedUrl: string; postId: string },
      PostErrors.FailedToCreatePost
    >
  >;

  deletePost(
    params: DeletePostParams,
  ): Promise<
    Result<
      void,
      | PostErrors.FailedToDeletePost
      | PostErrors.PostNotFound
      | PostErrors.NotPostOwner
      | PostErrors.PostDeleted
    >
  >;

  getPost(
    params: GetPostParams,
  ): Promise<Result<Post, PostErrors.PostNotFound | PostErrors.PostDeleted>>;

  paginatePosts(
    params: PaginatePostsParams,
  ): Promise<Result<PaginatedResponse<Post, PostCursor>, never>>;

  paginatePostsForFeed(
    params: PaginatePostsForFeedParams,
  ): Promise<
    Result<PaginatedResponse<Post, FeedCursor>, PostErrors.PostNotFound>
  >;

  getPostForNextJs(
    params: GetPostForNextJsParams,
  ): Promise<Result<Omit<Post, "hasLiked">, PostErrors.PostNotFound>>;
}

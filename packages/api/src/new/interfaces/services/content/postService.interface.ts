import type { Schema } from "@oppfy/db";

import type { PaginatedResponse } from "./postInteractionService.interface";

export type Post = Schema["post"]["$inferSelect"];

export type PostStats = Schema["postStats"]["$inferSelect"];

export interface BaseCursor {
  createdAt: Date;
  id: string;
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

export interface PaginatePostsOfUserSelfParams {
  userId: string;
  cursor: PostCursor | null;
  pageSize?: number;
}

export interface PaginatePostsOfUserOtherParams {
  userId: string;
  cursor: PostCursor | null;
  pageSize: number;
  currentUserId: string;
}

export interface PaginatePostsOfRecommendedParams {
  userId: string;
  cursor: PostCursor | null;
  pageSize: number;
}

export interface PaginatePostsForFeedParams {
  userId: string;
  cursor: FeedCursor | null;
  pageSize: number;
}

export interface GetPostParams {
  postId: string;
  userId: string;
}

export interface EditPostParams {
  postId: string;
  caption: string;
}

export interface DeletePostParams {
  postId: string;
  userId: string;
}

export interface GetPostForNextJsParams {
  postId: string;
}

export interface IPostService {
  uploadPostForUserOnAppUrl(
    params: UploadPostForUserOnAppUrlParams,
  ): Promise<{ presignedUrl: string; postId: string }>;

  uploadPostForUserNotOnAppUrl(
    params: UploadPostForUserNotOnAppUrlParams,
  ): Promise<{ presignedUrl: string; postId: string }>;

  uploadVideoPostForUserOnAppUrl(
    params: UploadVideoPostForUserOnAppUrlParams,
  ): Promise<{ presignedUrl: string; postId: string }>;

  uploadVideoPostForUserNotOnAppUrl(
    params: UploadVideoPostForUserNotOnAppUrlParams,
  ): Promise<{ presignedUrl: string; postId: string }>;

  paginatePostsOfUserSelf(
    params: PaginatePostsOfUserSelfParams,
  ): Promise<PaginatedResponse<Post, PostCursor>>;

  paginatePostsOfUserOther(
    params: PaginatePostsOfUserOtherParams,
  ): Promise<PaginatedResponse<Post, PostCursor>>;

  paginatePostsForFeed(
    params: PaginatePostsForFeedParams,
  ): Promise<PaginatedResponse<Post, FeedCursor>>;

  getPostForNextJs(
    params: GetPostForNextJsParams,
  ): Promise<Omit<Post, "hasLiked">>;

  getPost(params: GetPostParams): Promise<Post>;

  deletePost(params: DeletePostParams): Promise<void>;
}

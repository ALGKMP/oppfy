import type { Result } from "neverthrow";

import type { Schema } from "@oppfy/db";

import type * as PostErrors from "../../../errors/content/post.error";
import type { Comment, Post, Profile } from "../../../models";

export interface PaginatedResponse<TItem, TCursor> {
  items: TItem[];
  nextCursor: TCursor | null;
}

export interface HydratedAndProcessedPost {
  post: Post;
  assetUrl: string | null;
  postStats: PostStats;
  authorUserId: string;
  authorUsername: string;
  authorName: string | null;
  authorProfilePictureUrl: string | null;
  recipientUserId: string;
  recipientUsername: string;
  recipientName: string | null;
  recipientProfilePictureUrl: string | null;
  hasLiked: boolean;
}

export type HydratedAndProcessedPostWithoutLike = Omit<
  HydratedAndProcessedPost,
  "hasLiked"
>;

export interface HydratedAndProcessedComment {
  comment: Comment;
  authorUserId: string;
  authorUsername: string;
  authorName: string | null;
  authorProfilePictureUrl: string | null;
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

export interface PaginateCommentsParams {
  postId: string;
  cursor: CommentCursor | null;
  pageSize?: number;
}

export interface PaginatePostsForFeedParams {
  userId: string;
  cursor: FeedCursor | null;
  pageSize: number;
}

export interface PaginatedComment {
  comment: Comment;
  profile: Profile;
}

export interface CommentCursor {
  createdAt: Date;
  commentId: string;
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
  ): Promise<Result<void, PostErrors.NotPostOwner | PostErrors.PostNotFound>>;

  getPost(
    params: GetPostParams,
  ): Promise<Result<HydratedAndProcessedPost, PostErrors.PostNotFound>>;

  paginatePosts(
    params: PaginatePostsParams,
  ): Promise<
    Result<
      PaginatedResponse<HydratedAndProcessedPost, PostCursor | null>,
      never
    >
  >;

  paginatePostsForFeed(
    params: PaginatePostsForFeedParams,
  ): Promise<
    Result<
      PaginatedResponse<HydratedAndProcessedPost, FeedCursor | null>,
      PostErrors.PostNotFound
    >
  >;

  getPostForNextJs(
    params: GetPostForNextJsParams,
  ): Promise<
    Result<HydratedAndProcessedPostWithoutLike, PostErrors.PostNotFound>
  >;

  paginateComments(
    params: PaginateCommentsParams,
  ): Promise<
    Result<PaginatedResponse<HydratedAndProcessedComment, CommentCursor>, never>
  >;
}

import type { Schema } from "@oppfy/db";

export type Post = Schema["post"]["$inferSelect"];

export type PostStats = Schema["postStats"]["$inferSelect"];

export type Comment = Schema["comment"]["$inferSelect"];

export type Like = Schema["like"]["$inferSelect"];

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

export interface CommentCursor extends BaseCursor {
  commentId: string;
}

export interface PaginatedResponse<TItem, TCursor extends BaseCursor> {
  items: TItem[];
  nextCursor: TCursor | null;
}

export interface IPostService {
  uploadPostForUserOnAppUrl(options: {
    author: string;
    recipient: string;
    caption: string;
    height: string;
    width: string;
    contentLength: number;
    contentType: "image/jpeg" | "image/png" | "image/heic";
  }): Promise<{ presignedUrl: string; postId: string }>;

  uploadPostForUserNotOnAppUrl(options: {
    author: string;
    recipientNotOnAppPhoneNumber: string;
    recipientNotOnAppName: string;
    caption: string;
    height: string;
    width: string;
    contentLength: number;
    contentType: "image/jpeg" | "image/png" | "image/heic";
  }): Promise<{ presignedUrl: string; postId: string }>;

  uploadVideoPostForUserOnAppUrl(options: {
    author: string;
    recipient: string;
    caption: string;
    height: string;
    width: string;
  }): Promise<{ presignedUrl: string; postId: string }>;

  uploadVideoPostForUserNotOnAppUrl(options: {
    author: string;
    recipientNotOnAppPhoneNumber: string;
    recipientNotOnAppName: string;
    caption: string;
    height: string;
    width: string;
  }): Promise<{ presignedUrl: string; postId: string }>;

  paginatePostsOfUserSelf(options: {
    userId: string;
    cursor: PostCursor | null;
    pageSize?: number;
  }): Promise<PaginatedResponse<Post, PostCursor>>;

  paginatePostsOfUserOther(options: {
    userId: string;
    cursor: PostCursor | null;
    pageSize: number;
    currentUserId: string;
  }): Promise<PaginatedResponse<Post, PostCursor>>;

  paginatePostsOfRecommended(options: {
    userId: string;
    cursor: PostCursor | null;
    pageSize: number;
  }): Promise<PaginatedResponse<Post, PostCursor>>;

  paginatePostsForFeed(options: {
    userId: string;
    cursor: FeedCursor | null;
    pageSize: number;
  }): Promise<PaginatedResponse<Post, FeedCursor>>;

  getPost(options: { postId: string; userId: string }): Promise<Post>;

  editPost(options: { postId: string; caption: string }): Promise<void>;

  deletePost(options: { postId: string; userId: string }): Promise<void>;

  likePost(options: { userId: string; postId: string }): Promise<void>;

  unlikePost(options: { userId: string; postId: string }): Promise<void>;

  getLike(options: { userId: string; postId: string }): Promise<boolean>;

  commentOnPost(options: {
    userId: string;
    postId: string;
    body: string;
  }): Promise<void>;

  deleteComment(options: {
    userId: string;
    commentId: string;
    postId: string;
  }): Promise<void>;

  paginateComments(options: {
    postId: string;
    cursor: CommentCursor | null;
    pageSize?: number;
  }): Promise<PaginatedResponse<Comment, CommentCursor>>;

  getPostForNextJs(options: {
    postId: string;
  }): Promise<Omit<Post, "hasLiked">>;
}

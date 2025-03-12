import type { Transaction } from "@oppfy/db";

export interface GetPostParams {
  postId: string;
  userId: string;
}

export interface GetPostForNextJsParams {
  postId: string;
}

export interface GetPostFromCommentIdParams {
  commentId: string;
}

export interface PaginatePostsParams {
  userId: string;
  cursor?: { createdAt: Date; postId: string } | null;
  pageSize?: number;
}

export interface UpdatePostParams {
  postId: string;
  caption: string;
}

export interface CreatePostStatsParams {
  postId: string;
}

export interface DeletePostParams {
  userId: string;
  postId: string;
}

export interface IPostRepository {
  getPost(params: GetPostParams, tx?: Transaction): Promise<Post | undefined>;
  getPostForNextJs(
    params: GetPostForNextJsParams,
    tx?: Transaction,
  ): Promise<PostForNextJs | undefined>;
  paginatePostsOfFollowing(
    params: PaginatePostsParams,
    tx?: Transaction,
  ): Promise<PaginatedPost[]>;
  paginatePostsOfUser(
    params: PaginatePostsParams,
    tx?: Transaction,
  ): Promise<PaginatedPost[]>;
  updatePost(params: UpdatePostParams, tx?: Transaction): Promise<void>;
  createPostStats(
    params: CreatePostStatsParams,
    tx?: Transaction,
  ): Promise<void>;
  deletePost(params: DeletePostParams, tx?: Transaction): Promise<void>;
}

// Return types
export interface Post {
  postId: string;
  authorId: string;
  authorUsername: string;
  authorProfileId: string;
  authorProfilePicture: string | null;
  authorName: string | null;
  recipientId: string;
  recipientProfileId: string;
  recipientUsername: string;
  recipientProfilePicture: string | null;
  recipientName: string | null;
  caption: string;
  imageUrl: string;
  width: number;
  height: number;
  commentsCount: number;
  likesCount: number;
  mediaType: string;
  createdAt: Date;
  hasLiked: boolean;
}

export type PostForNextJs = Omit<Post, "hasLiked">;

export type PostFromComment = PostForNextJs;

export type PaginatedPost = Post;

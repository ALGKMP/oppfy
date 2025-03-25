import type { DatabaseOrTransaction, SQL, Transaction } from "@oppfy/db";

import type { Post } from "../../../models";

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
  deletePost(params: DeletePostParams, tx: Transaction): Promise<void>;
}

export type PostForNextJs = Omit<Post, "hasLiked">;

export type PostFromComment = PostForNextJs;

export type PaginatedPost = Post;

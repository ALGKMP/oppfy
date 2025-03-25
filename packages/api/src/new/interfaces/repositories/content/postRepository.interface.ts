import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Like, Post } from "../../../models";

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

export interface LikeParams {
  postId: string;
  userId: string;
}

export interface IPostRepository {
  getPost(
    params: GetPostParams,
    db?: DatabaseOrTransaction,
  ): Promise<Post | undefined>;

  getPostForNextJs(
    params: GetPostForNextJsParams,
    db?: DatabaseOrTransaction,
  ): Promise<PostForNextJs | undefined>;

  paginatePostsOfFollowing(
    params: PaginatePostsParams,
    db?: DatabaseOrTransaction,
  ): Promise<PaginatedPost[]>;

  paginatePostsOfUser(
    params: PaginatePostsParams,
    db?: DatabaseOrTransaction,
  ): Promise<PaginatedPost[]>;

  updatePost(
    params: UpdatePostParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  createPostStats(
    params: CreatePostStatsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deletePost(
    params: DeletePostParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  addLike(params: LikeParams, db?: DatabaseOrTransaction): Promise<void>;

  removeLike(params: LikeParams, db?: DatabaseOrTransaction): Promise<void>;

  findLike(
    params: LikeParams,
    db?: DatabaseOrTransaction,
  ): Promise<Like | undefined>;
}

export type PostForNextJs = Omit<Post, "hasLiked">;

export type PostFromComment = PostForNextJs;

export type PaginatedPost = Post;

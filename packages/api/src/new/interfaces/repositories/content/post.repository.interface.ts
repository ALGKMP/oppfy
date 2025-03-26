import type { InferSelectModel } from "drizzle-orm";

import type { DatabaseOrTransaction, schema } from "@oppfy/db";

export interface GetPostParams {
  postId: string;
  userId: string;
}

export interface GetPostForSiteParams {
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

export interface PostResult {
  post: InferSelectModel<typeof schema.post>;
  postStats: InferSelectModel<typeof schema.postStats>;
  authorProfile: InferSelectModel<typeof schema.profile>;
  recipientProfile: InferSelectModel<typeof schema.profile>;
  like: InferSelectModel<typeof schema.like> | null;
}

export interface PostResultWithLike extends PostResult {
  like: InferSelectModel<typeof schema.like> | null;
}

export interface IPostRepository {
  getPost(
    params: GetPostParams,
    db?: DatabaseOrTransaction,
  ): Promise<PostResult | undefined>;
  getPostForSite(
    params: GetPostForSiteParams,
    db?: DatabaseOrTransaction,
  ): Promise<PostResultWithLike | undefined>;
  paginatePostsOfFollowing(
    params: PaginatePostsParams,
    db?: DatabaseOrTransaction,
  ): Promise<PostResult[]>;
  paginatePostsOfUser(
    params: PaginatePostsParams,
    db?: DatabaseOrTransaction,
  ): Promise<PostResult[]>;
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
}

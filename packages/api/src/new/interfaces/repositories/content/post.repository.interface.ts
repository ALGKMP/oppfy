import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";
import type { InferSelectModel } from "drizzle-orm";
import type { schema } from "@oppfy/db";

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

// Define the raw result type based on schema
export interface PostResult {
  post: InferSelectModel<typeof schema.post>;
  postStats: InferSelectModel<typeof schema.postStats>;
  authorProfile: InferSelectModel<typeof schema.profile>;
  recipientProfile: InferSelectModel<typeof schema.profile>;
  like: InferSelectModel<typeof schema.like> | null;
};

// For methods without the like join (e.g., getPostForNextJs)
export type PostResultWithoutLike = Omit<PostResult, "like">;

export interface IPostRepository {
  getPost(params: GetPostParams, tx?: Transaction): Promise<PostResult | undefined>;
  getPostForNextJs(
    params: GetPostForNextJsParams,
    tx?: Transaction,
  ): Promise<PostResultWithoutLike | undefined>;
  paginatePostsOfFollowing(
    params: PaginatePostsParams,
    tx?: Transaction,
  ): Promise<PostResult[]>;
  paginatePostsOfUser(
    params: PaginatePostsParams,
    tx?: Transaction,
  ): Promise<PostResult[]>;
  updatePost(params: UpdatePostParams, tx?: Transaction): Promise<void>;
  createPostStats(params: CreatePostStatsParams, tx?: Transaction): Promise<void>;
  deletePost(params: DeletePostParams, tx: Transaction): Promise<void>;
}
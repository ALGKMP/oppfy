import type { InferSelectModel } from "drizzle-orm";

import type { schema, Transaction } from "@oppfy/db";

export type Comment = InferSelectModel<typeof schema.comment>;

export interface GetCommentParams {
  commentId: string;
}

export interface RemoveCommentParams {
  commentId: string;
}

export interface CountCommentsParams {
  postId: string;
}

export interface AddCommentParams {
  postId: string;
  userId: string;
  body: string;
}

export interface PaginateCommentsParams {
  postId: string;
  cursor?: { createdAt: Date; commentId: string };
  pageSize?: number;
}

export interface PaginatedComment {
  commentId: string;
  userId: string;
  username: string;
  profilePictureUrl: string | null;
  postId: string;
  body: string;
  createdAt: Date;
}

export interface ICommentRepository {
  getComment(
    params: GetCommentParams,
    tx?: Transaction,
  ): Promise<Comment | undefined>;
  addComment(params: AddCommentParams, tx?: Transaction): Promise<void>;
  removeComment(params: RemoveCommentParams, tx?: Transaction): Promise<void>;
  countComments(params: CountCommentsParams, tx?: Transaction): Promise<number>;
  paginateComments(
    params: PaginateCommentsParams,
    tx?: Transaction,
  ): Promise<PaginatedComment[]>;
}

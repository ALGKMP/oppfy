import type { InferSelectModel } from "drizzle-orm";

import type { DatabaseOrTransaction, schema, Transaction } from "@oppfy/db";

import type { Comment, Profile } from "../../../models";
import type { PaginationParams } from "../../types";

export interface GetCommentParams {
  commentId: string;
}

export interface RemoveCommentParams {
  commentId: string;
  postId: string;
}

export interface CountCommentsParams {
  postId: string;
}

export interface AddCommentParams {
  userId: string;
  postId: string;
  body: string;
}

export interface PaginateCommentsParams extends PaginationParams {
  postId: string;
}

export interface PaginatedCommentResult {
  comment: Comment;
  profile: Profile;
}

export interface ICommentRepository {
  getComment(
    params: GetCommentParams,
    db?: DatabaseOrTransaction,
  ): Promise<Comment | undefined>;

  addComment(params: AddCommentParams, tx: Transaction): Promise<void>;

  removeComment(params: RemoveCommentParams, tx: Transaction): Promise<void>;

  countComments(
    params: CountCommentsParams,
    db?: DatabaseOrTransaction,
  ): Promise<number>;

  paginateComments(
    params: PaginateCommentsParams,
    db?: DatabaseOrTransaction,
  ): Promise<PaginatedCommentResult[]>;
}

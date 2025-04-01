import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";

import type { Comment, Profile } from "../../../models";
import type { PaginationParams } from "../../types";

export interface GetCommentParams {
  commentId: string;
}

export interface DeleteCommentParams {
  commentId: string;
  postId: string;
}

export interface CreateCommentParams {
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

  createComment(params: CreateCommentParams, tx: Transaction): Promise<void>;

  deleteComment(params: DeleteCommentParams, tx: Transaction): Promise<void>;

  paginateComments(
    params: PaginateCommentsParams,
    db?: DatabaseOrTransaction,
  ): Promise<PaginatedCommentResult[]>;
}

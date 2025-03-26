import type { InferSelectModel } from "drizzle-orm";

import type { DatabaseOrTransaction, schema, Transaction } from "@oppfy/db";

import type { Profile } from "../../../models";
import type { CommentCursor } from "../../services/content/postInteraction.service.interface";

export type Comment = InferSelectModel<typeof schema.comment>;

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
  postId: string;
  userId: string;
  body: string;
}

export interface PaginateCommentsParams {
  postId: string;
  cursor: CommentCursor | null;
  pageSize?: number;
}

export interface PaginatedComment {
  comment: Comment;
  profile: Profile;
}

export interface ICommentRepository {
  getComment(
    params: GetCommentParams,
    db?: DatabaseOrTransaction,
  ): Promise<Comment | undefined>;

  addComment(
    params: AddCommentParams,
    tx: Transaction,
  ): Promise<void>;

  removeComment(
    params: RemoveCommentParams,
    tx: Transaction,
  ): Promise<void>;

  countComments(
    params: CountCommentsParams,
    db?: DatabaseOrTransaction,
  ): Promise<number>;

  paginateComments(
    params: PaginateCommentsParams,
    db?: DatabaseOrTransaction,
  ): Promise<PaginatedComment[]>;
}

import type { Schema } from "@oppfy/db";

export type Post = Schema["post"]["$inferSelect"];
export type Like = Schema["like"]["$inferSelect"];
export type Comment = Schema["comment"]["$inferSelect"];

export interface BaseCursor {
  createdAt: Date;
  id: string;
}

export interface CommentCursor extends BaseCursor {
  commentId: string;
}

export interface PaginatedResponse<TItem, TCursor extends BaseCursor> {
  items: TItem[];
  nextCursor: TCursor | null;
}

export interface LikePostParams {
  userId: string;
  postId: string;
}

export interface UnlikePostParams {
  userId: string;
  postId: string;
}

export interface GetLikeParams {
  userId: string;
  postId: string;
}

export interface CommentOnPostParams {
  userId: string;
  postId: string;
  body: string;
}

export interface DeleteCommentParams {
  userId: string;
  commentId: string;
  postId: string;
}

export interface PaginateCommentsParams {
  postId: string;
  cursor: CommentCursor | null;
  pageSize?: number;
}

export interface IPostInteractionService {
  likePost(params: LikePostParams): Promise<void>;
  unlikePost(params: UnlikePostParams): Promise<void>;
  getLike(params: GetLikeParams): Promise<boolean>;
  commentOnPost(params: CommentOnPostParams): Promise<void>;
  deleteComment(params: DeleteCommentParams): Promise<void>;
  paginateComments(
    params: PaginateCommentsParams,
  ): Promise<PaginatedResponse<Comment, CommentCursor>>;
}

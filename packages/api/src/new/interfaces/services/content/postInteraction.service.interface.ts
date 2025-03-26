import type { Result } from "neverthrow";

import type { PostInteractionErrors } from "../../../errors/content/postInteraction.error";
import type { PaginatedComment } from "../../repositories/content/comment.repository.interface";

export interface BaseCursor {
  createdAt: Date;
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
  userId: string;
  cursor: CommentCursor | null;
  pageSize?: number;
}

export interface IPostInteractionService {
  likePost(
    params: LikePostParams,
  ): Promise<
    Result<
      void,
      | PostInteractionErrors.FailedToLikePost
      | PostInteractionErrors.AlreadyLiked
      | PostInteractionErrors.PostNotFound
    >
  >;

  unlikePost(
    params: UnlikePostParams,
  ): Promise<
    Result<
      void,
      | PostInteractionErrors.FailedToUnlikePost
      | PostInteractionErrors.NotLiked
      | PostInteractionErrors.PostNotFound
    >
  >;

  getLike(
    params: GetLikeParams,
  ): Promise<Result<boolean, PostInteractionErrors.PostNotFound>>;

  commentOnPost(
    params: CommentOnPostParams,
  ): Promise<
    Result<
      void,
      PostInteractionErrors.FailedToComment | PostInteractionErrors.PostNotFound
    >
  >;

  deleteComment(
    params: DeleteCommentParams,
  ): Promise<
    Result<
      void,
      | PostInteractionErrors.FailedToDeleteComment
      | PostInteractionErrors.CommentNotFound
      | PostInteractionErrors.NotCommentOwner
    >
  >;

  paginateComments(
    params: PaginateCommentsParams,
  ): Promise<
    Result<
      PaginatedResponse<PaginatedComment, CommentCursor>,
      PostInteractionErrors.PostNotFound
    >
  >;
}

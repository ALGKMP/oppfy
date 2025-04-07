import type { Result } from "neverthrow";

import type * as PostInteractionErrors from "../../../errors/content/postInteraction.error";

export interface LikePostParams {
  postId: string;
  userId: string;
}

export interface UnlikePostParams {
  postId: string;
  userId: string;
}

export interface AddCommentParams {
  postId: string;
  userId: string;
  body: string;
}

export interface RemoveCommentParams {
  commentId: string;
  postId: string;
  userId: string;
}

export interface PaginatedResponse<TItem, TCursor> {
  items: TItem[];
  nextCursor: TCursor | null;
}

export interface IPostInteractionService {
  likePost(
    params: LikePostParams,
  ): Promise<
    Result<
      void,
      | PostInteractionErrors.PostNotFound
      | PostInteractionErrors.FailedToLikePost
      | PostInteractionErrors.AlreadyLiked
    >
  >;

  unlikePost(
    params: UnlikePostParams,
  ): Promise<
    Result<
      void,
      | PostInteractionErrors.PostNotFound
      | PostInteractionErrors.FailedToUnlikePost
      | PostInteractionErrors.NotLiked
    >
  >;

  addComment(
    params: AddCommentParams,
  ): Promise<
    Result<
      void,
      PostInteractionErrors.PostNotFound | PostInteractionErrors.FailedToComment
    >
  >;

  removeComment(
    params: RemoveCommentParams,
  ): Promise<
    Result<
      void,
      | PostInteractionErrors.CommentNotFound
      | PostInteractionErrors.NotCommentOwner
      | PostInteractionErrors.FailedToDeleteComment
    >
  >;
}

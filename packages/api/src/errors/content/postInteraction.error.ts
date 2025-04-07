import { createBaseErrorClass } from "../errorFactory";

const PostInteractionError = createBaseErrorClass("PostInteraction");

export class FailedToLikePost extends PostInteractionError {
  name = "FailedToLikePostError" as const;
  constructor(postId: string, userId: string) {
    super(`Failed to like post ${postId} for user ${userId}`);
  }
}

export class FailedToUnlikePost extends PostInteractionError {
  name = "FailedToUnlikePostError" as const;
  constructor(postId: string, userId: string) {
    super(`Failed to unlike post ${postId} for user ${userId}`);
  }
}

export class FailedToComment extends PostInteractionError {
  name = "FailedToCommentError" as const;
  constructor(postId: string, userId: string) {
    super(`Failed to comment on post ${postId} for user ${userId}`);
  }
}

export class FailedToDeleteComment extends PostInteractionError {
  name = "FailedToDeleteCommentError" as const;
  constructor(commentId: string, userId: string) {
    super(`Failed to delete comment ${commentId} for user ${userId}`);
  }
}

export class CommentNotFound extends PostInteractionError {
  name = "CommentNotFoundError" as const;
  constructor(commentId: string) {
    super(`Comment ${commentId} not found`);
  }
}

export class NotCommentOwner extends PostInteractionError {
  name = "NotCommentOwnerError" as const;
  constructor(commentId: string, userId: string) {
    super(`User ${userId} is not the owner of comment ${commentId}`);
  }
}

export class PostNotFound extends PostInteractionError {
  name = "PostNotFoundError" as const;
  constructor(postId: string) {
    super(`Post ${postId} not found`);
  }
}

export class AlreadyLiked extends PostInteractionError {
  name = "AlreadyLikedError" as const;
  constructor(postId: string, userId: string) {
    super(`User ${userId} has already liked post ${postId}`);
  }
}

export class NotLiked extends PostInteractionError {
  name = "NotLikedError" as const;
  constructor(postId: string, userId: string) {
    super(`User ${userId} has not liked post ${postId}`);
  }
}

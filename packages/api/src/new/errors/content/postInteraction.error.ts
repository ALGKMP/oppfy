import { createBaseErrorClass } from "../errorFactory";

const PostInteractionError = createBaseErrorClass("PostInteraction");

export class FailedToLikePost extends PostInteractionError {
  constructor(postId: string, userId: string) {
    super(`Failed to like post ${postId} for user ${userId}`);
  }
}

export class FailedToUnlikePost extends PostInteractionError {
  constructor(postId: string, userId: string) {
    super(`Failed to unlike post ${postId} for user ${userId}`);
  }
}

export class FailedToComment extends PostInteractionError {
  constructor(postId: string, userId: string) {
    super(`Failed to comment on post ${postId} for user ${userId}`);
  }
}

export class FailedToDeleteComment extends PostInteractionError {
  constructor(commentId: string, userId: string) {
    super(`Failed to delete comment ${commentId} for user ${userId}`);
  }
}

export class CommentNotFound extends PostInteractionError {
  constructor(commentId: string) {
    super(`Comment ${commentId} not found`);
  }
}

export class NotCommentOwner extends PostInteractionError {
  constructor(commentId: string, userId: string) {
    super(`User ${userId} is not the owner of comment ${commentId}`);
  }
}

export class PostNotFound extends PostInteractionError {
  constructor(postId: string) {
    super(`Post ${postId} not found`);
  }
}

export class AlreadyLiked extends PostInteractionError {
  constructor(postId: string, userId: string) {
    super(`User ${userId} has already liked post ${postId}`);
  }
}

export class NotLiked extends PostInteractionError {
  constructor(postId: string, userId: string) {
    super(`User ${userId} has not liked post ${postId}`);
  }
}

export type PostInteractionError = InstanceType<typeof PostInteractionError>;

import { createBaseErrorClass } from "../errorFactory";

const PostError = createBaseErrorClass("Post");

export class FailedToCreatePost extends PostError {
  constructor(userId: string) {
    super(`Failed to create post for user ${userId}`);
  }
}

export class FailedToUpdatePost extends PostError {
  constructor(postId: string) {
    super(`Failed to update post ${postId}`);
  }
}

export class FailedToDeletePost extends PostError {
  constructor(postId: string) {
    super(`Failed to delete post ${postId}`);
  }
}

export class PostNotFound extends PostError {
  constructor(postId: string) {
    super(`Post ${postId} not found`);
  }
}

export class PostDeleted extends PostError {
  constructor(postId: string) {
    super(`Post ${postId} has been deleted`);
  }
}

export class InvalidPostContent extends PostError {
  constructor(message: string) {
    super(message);
  }
}

export class NotPostOwner extends PostError {
  constructor(postId: string, userId: string) {
    super(`User ${userId} is not the owner of post ${postId}`);
  }
}

export type PostError = InstanceType<typeof PostError>;

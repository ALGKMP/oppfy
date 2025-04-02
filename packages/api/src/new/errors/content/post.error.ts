import { createBaseErrorClass } from "../errorFactory";

const PostError = createBaseErrorClass("Post");

export class FailedToCreatePost extends PostError {
  name = "FailedToCreatePostError" as const;
  constructor(userId: string) {
    super(`Failed to create post for user ${userId}`);
  }
}

export class FailedToUpdatePost extends PostError {
  name = "FailedToUpdatePostError" as const;
  constructor(postId: string) {
    super(`Failed to update post ${postId}`);
  }
}

export class FailedToDeletePost extends PostError {
  name = "FailedToDeletePostError" as const;
  constructor(postId: string) {
    super(`Failed to delete post ${postId}`);
  }
}

export class PostNotFound extends PostError {
  name = "PostNotFoundError" as const;
  constructor(postId: string) {
    super(`Post ${postId} not found`);
  }
}

export class PostDeleted extends PostError {
  name = "PostDeletedError" as const;
  constructor(postId: string) {
    super(`Post ${postId} has been deleted`);
  }
}

export class InvalidPostContent extends PostError {
  name = "InvalidPostContentError" as const;
  constructor(message: string) {
    super(message);
  }
}

export class NotPostOwner extends PostError {
  name = "NotPostOwnerError" as const;
  constructor(postId: string, userId: string) {
    super(`User ${userId} is not the owner of post ${postId}`);
  }
}

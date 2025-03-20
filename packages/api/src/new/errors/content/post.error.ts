import { DomainError } from "../domain.error";

export namespace PostErrors {
  export class FailedToCreatePost extends DomainError {
    constructor(userId: string) {
      super(
        "FAILED_TO_CREATE_POST",
        `Failed to create post for user ${userId}`,
      );
    }
  }

  export class FailedToUpdatePost extends DomainError {
    constructor(postId: string) {
      super("FAILED_TO_UPDATE_POST", `Failed to update post ${postId}`);
    }
  }

  export class FailedToDeletePost extends DomainError {
    constructor(postId: string) {
      super("FAILED_TO_DELETE_POST", `Failed to delete post ${postId}`);
    }
  }

  export class PostNotFound extends DomainError {
    constructor(postId: string) {
      super("POST_NOT_FOUND", `Post ${postId} not found`);
    }
  }

  export class NotPostOwner extends DomainError {
    constructor(postId: string, userId: string) {
      super(
        "NOT_POST_OWNER",
        `User ${userId} is not the owner of post ${postId}`,
      );
    }
  }

  export class PostDeleted extends DomainError {
    constructor(postId: string) {
      super("POST_DELETED", `Post ${postId} has been deleted`);
    }
  }

  export class InvalidPostContent extends DomainError {
    constructor(message: string) {
      super("INVALID_POST_CONTENT", message);
    }
  }
}

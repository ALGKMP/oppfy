import { createBaseErrorClass } from "../errorFactory";

const PostError = createBaseErrorClass("Post");

export const PostErrors = {
  FailedToCreatePost: class extends PostError {
    constructor(userId: string) {
      super(`Failed to create post for user ${userId}`);
    }
  },

  FailedToUpdatePost: class extends PostError {
    constructor(postId: string) {
      super(`Failed to update post ${postId}`);
    }
  },

  FailedToDeletePost: class extends PostError {
    constructor(postId: string) {
      super(`Failed to delete post ${postId}`);
    }
  },

  PostNotFound: class extends PostError {
    constructor(postId: string) {
      super(`Post ${postId} not found`);
    }
  },

  PostDeleted: class extends PostError {
    constructor(postId: string) {
      super(`Post ${postId} has been deleted`);
    }
  },

  InvalidPostContent: class extends PostError {
    constructor(message: string) {
      super(message);
    }
  },

  NotPostOwner: class extends PostError {
    constructor(postId: string, userId: string) {
      super(`User ${userId} is not the owner of post ${postId}`);
    }
  },
};

export type PostError = InstanceType<typeof PostError>;

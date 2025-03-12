export class SocialRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialRepositoryError";
  }
}

export class ProfileNotFoundError extends SocialRepositoryError {
  constructor(userId: string) {
    super(`Profile not found for user ${userId}`);
    this.name = "ProfileNotFoundError";
  }
}

export class BlockNotFoundError extends SocialRepositoryError {
  constructor() {
    super("Block relationship not found");
    this.name = "BlockNotFoundError";
  }
}

export class FollowNotFoundError extends SocialRepositoryError {
  constructor() {
    super("Follow relationship not found");
    this.name = "FollowNotFoundError";
  }
}

export class FollowRequestNotFoundError extends SocialRepositoryError {
  constructor() {
    super("Follow request not found");
    this.name = "FollowRequestNotFoundError";
  }
}

export class FriendshipNotFoundError extends SocialRepositoryError {
  constructor() {
    super("Friendship not found");
    this.name = "FriendshipNotFoundError";
  }
}

export class FriendRequestNotFoundError extends SocialRepositoryError {
  constructor() {
    super("Friend request not found");
    this.name = "FriendRequestNotFoundError";
  }
}

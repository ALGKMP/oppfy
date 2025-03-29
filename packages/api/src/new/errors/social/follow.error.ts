import { createBaseErrorClass } from "../errorFactory";

const FollowError = createBaseErrorClass("Follow");

export const FollowErrors = {
  AlreadyFollowing: class extends FollowError {
    constructor(followerId: string, followeeId: string) {
      super(`User "${followerId}" is already following "${followeeId}"`);
    }
  },

  NotFollowing: class extends FollowError {
    constructor(followerId: string, followeeId: string) {
      super(`User "${followerId}" is not following "${followeeId}"`);
    }
  },

  RequestNotFound: class extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(`Follow request from "${senderId}" to "${recipientId}" not found`);
    }
  },

  RequestAlreadySent: class extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Follow request already sent from "${senderId}" to "${recipientId}"`,
      );
    }
  },

  CannotFollowSelf: class extends FollowError {
    constructor(userId: string) {
      super(`User "${userId}" cannot follow themselves`);
    }
  },

  FailedToAcceptRequest: class extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to accept follow request from "${senderId}" to "${recipientId}"`,
      );
    }
  },

  FailedToDeclineRequest: class extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to decline follow request from "${senderId}" to "${recipientId}"`,
      );
    }
  },

  FailedToRemove: class extends FollowError {
    constructor(followerId: string, followeeId: string) {
      super(
        `Failed to remove follow relationship between "${followerId}" and "${followeeId}"`,
      );
    }
  },

  FailedToSendRequest: class extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to send follow request from "${senderId}" to "${recipientId}"`,
      );
    }
  },

  FailedToCountFollowers: class extends FollowError {
    constructor() {
      super("Failed to count followers");
    }
  },

  FailedToCountFollowing: class extends FollowError {
    constructor() {
      super("Failed to count following");
    }
  },

  FailedToCountRequests: class extends FollowError {
    constructor() {
      super("Failed to count follow requests");
    }
  },
};

export type FollowError = InstanceType<typeof FollowError>;

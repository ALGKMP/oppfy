import { createBaseErrorClass } from "../errorFactory";

const FriendError = createBaseErrorClass("Friend");

export const FriendErrors = {
  NotFound: class extends FriendError {
    constructor(userIdA: string, userIdB: string) {
      super(`Friendship between users "${userIdA}" and "${userIdB}" not found`);
    }
  },

  RequestNotFound: class extends FriendError {
    constructor(senderId: string, recipientId: string) {
      super(`Friend request from "${senderId}" to "${recipientId}" not found`);
    }
  },

  RequestAlreadySent: class extends FriendError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Friend request already sent from "${senderId}" to "${recipientId}"`,
      );
    }
  },

  AlreadyFriends: class extends FriendError {
    constructor(userIdA: string, userIdB: string) {
      super(`Users "${userIdA}" and "${userIdB}" are already friends`);
    }
  },

  CannotFriendSelf: class extends FriendError {
    constructor(userId: string) {
      super(`User "${userId}" cannot friend themselves`);
    }
  },

  FailedToCountRequests: class extends FriendError {
    constructor() {
      super("Failed to count friend requests");
    }
  },

  FailedToRemove: class extends FriendError {
    constructor(userIdA: string, userIdB: string) {
      super(
        `Failed to remove friendship between "${userIdA}" and "${userIdB}"`,
      );
    }
  },

  FailedToSendRequest: class extends FriendError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to send friend request from "${senderId}" to "${recipientId}"`,
      );
    }
  },

  FailedToAcceptRequest: class extends FriendError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to accept friend request from "${senderId}" to "${recipientId}"`,
      );
    }
  },

  FailedToDeclineRequest: class extends FriendError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to decline friend request from "${senderId}" to "${recipientId}"`,
      );
    }
  },

  FailedToCancelRequest: class extends FriendError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to cancel friend request from "${senderId}" to "${recipientId}"`,
      );
    }
  },
};

export type FriendError = InstanceType<typeof FriendError>;

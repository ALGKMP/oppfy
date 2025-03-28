import { createBaseErrorClass } from "../errorFactory";

const FollowError = createBaseErrorClass("Follow");

export namespace FollowErrors {
  export class AlreadyFollowing extends FollowError {
    constructor(followerId: string, followeeId: string) {
      super(`User "${followerId}" is already following "${followeeId}"`);
    }
  }

  export class NotFollowing extends FollowError {
    constructor(followerId: string, followeeId: string) {
      super(`User "${followerId}" is not following "${followeeId}"`);
    }
  }

  export class RequestNotFound extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(`Follow request from "${senderId}" to "${recipientId}" not found`);
    }
  }

  export class RequestAlreadySent extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Follow request already sent from "${senderId}" to "${recipientId}"`,
      );
    }
  }

  export class CannotFollowSelf extends FollowError {
    constructor(userId: string) {
      super(`User "${userId}" cannot follow themselves`);
    }
  }

  export class FailedToAcceptRequest extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to accept follow request from "${senderId}" to "${recipientId}"`,
      );
    }
  }

  export class FailedToDeclineRequest extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to decline follow request from "${senderId}" to "${recipientId}"`,
      );
    }
  }

  export class FailedToRemove extends FollowError {
    constructor(followerId: string, followeeId: string) {
      super(
        `Failed to remove follow relationship between "${followerId}" and "${followeeId}"`,
      );
    }
  }

  export class FailedToSendRequest extends FollowError {
    constructor(senderId: string, recipientId: string) {
      super(
        `Failed to send follow request from "${senderId}" to "${recipientId}"`,
      );
    }
  }

  export class FailedToCountFollowers extends FollowError {
    constructor() {
      super("Failed to count followers");
    }
  }

  export class FailedToCountFollowing extends FollowError {
    constructor() {
      super("Failed to count following");
    }
  }

  export class FailedToCountRequests extends FollowError {
    constructor() {
      super("Failed to count follow requests");
    }
  }
}

export type FollowError = InstanceType<typeof FollowError>;

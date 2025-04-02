import { createBaseErrorClass } from "../errorFactory";

const FollowError = createBaseErrorClass("Follow");

export class AlreadyFollowing extends FollowError {
  name = "AlreadyFollowingError" as const;
  constructor(followerId: string, followeeId: string) {
    super(`User "${followerId}" is already following "${followeeId}"`);
  }
}

export class NotFollowing extends FollowError {
  name = "NotFollowingError" as const;
  constructor(followerId: string, followeeId: string) {
    super(`User "${followerId}" is not following "${followeeId}"`);
  }
}

export class RequestNotFound extends FollowError {
  name = "FollowRequestNotFoundError" as const;
  constructor(senderId: string, recipientId: string) {
    super(`Follow request from "${senderId}" to "${recipientId}" not found`);
  }
}

export class RequestAlreadySent extends FollowError {
  name = "FollowRequestAlreadySentError" as const;
  constructor(senderId: string, recipientId: string) {
    super(`Follow request already sent from "${senderId}" to "${recipientId}"`);
  }
}

export class CannotFollowSelf extends FollowError {
  name = "CannotFollowSelfError" as const;
  constructor(userId: string) {
    super(`User "${userId}" cannot follow themselves`);
  }
}

export class FailedToAcceptRequest extends FollowError {
  name = "FailedToAcceptRequestError" as const;
  constructor(senderId: string, recipientId: string) {
    super(
      `Failed to accept follow request from "${senderId}" to "${recipientId}"`,
    );
  }
}

export class FailedToDeclineRequest extends FollowError {
  name = "FailedToDeclineRequestError" as const;
  constructor(senderId: string, recipientId: string) {
    super(
      `Failed to decline follow request from "${senderId}" to "${recipientId}"`,
    );
  }
}

export class FailedToRemove extends FollowError {
  name = "FailedToRemoveError" as const;
  constructor(followerId: string, followeeId: string) {
    super(
      `Failed to remove follow relationship between "${followerId}" and "${followeeId}"`,
    );
  }
}

export class FailedToSendRequest extends FollowError {
  name = "FailedToSendRequestError" as const;
  constructor(senderId: string, recipientId: string) {
    super(
      `Failed to send follow request from "${senderId}" to "${recipientId}"`,
    );
  }
}

export class FailedToCountFollowers extends FollowError {
  name = "FailedToCountFollowersError" as const;
  constructor() {
    super("Failed to count followers");
  }
}

export class FailedToCountFollowing extends FollowError {
  name = "FailedToCountFollowingError" as const;
  constructor() {
    super("Failed to count following");
  }
}

export class FailedToCountRequests extends FollowError {
  name = "FailedToCountRequestsError" as const;
  constructor() {
    super("Failed to count follow requests");
  }
}

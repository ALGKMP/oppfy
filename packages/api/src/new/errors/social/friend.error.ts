import { createBaseErrorClass } from "../errorFactory";

const FriendError = createBaseErrorClass("Friend");

export class NotFound extends FriendError {
  constructor(userIdA: string, userIdB: string) {
    super(`Friendship between users "${userIdA}" and "${userIdB}" not found`);
  }
}

export class RequestNotFound extends FriendError {
  constructor(senderId: string, recipientId: string) {
    super(`Friend request from "${senderId}" to "${recipientId}" not found`);
  }
}

export class RequestAlreadySent extends FriendError {
  constructor(senderId: string, recipientId: string) {
    super(`Friend request already sent from "${senderId}" to "${recipientId}"`);
  }
}

export class AlreadyFriends extends FriendError {
  constructor(userIdA: string, userIdB: string) {
    super(`Users "${userIdA}" and "${userIdB}" are already friends`);
  }
}

export class MustUnfriendFirst extends FriendError {
  constructor(userIdA: string, userIdB: string) {
    super(
      `User "${userIdA}" must unfriend "${userIdB}" before sending a new request`,
    );
  }
}

export class CannotFriendSelf extends FriendError {
  constructor(userId: string) {
    super(`User "${userId}" cannot friend themselves`);
  }
}

export class FailedToCountRequests extends FriendError {
  constructor() {
    super("Failed to count friend requests");
  }
}

export class FailedToRemove extends FriendError {
  constructor(userIdA: string, userIdB: string) {
    super(`Failed to remove friendship between "${userIdA}" and "${userIdB}"`);
  }
}

export class FailedToSendRequest extends FriendError {
  constructor(senderId: string, recipientId: string) {
    super(
      `Failed to send friend request from "${senderId}" to "${recipientId}"`,
    );
  }
}

export class FailedToAcceptRequest extends FriendError {
  constructor(senderId: string, recipientId: string) {
    super(
      `Failed to accept friend request from "${senderId}" to "${recipientId}"`,
    );
  }
}

export class FailedToDeclineRequest extends FriendError {
  constructor(senderId: string, recipientId: string) {
    super(
      `Failed to decline friend request from "${senderId}" to "${recipientId}"`,
    );
  }
}

export class FailedToCancelRequest extends FriendError {
  constructor(senderId: string, recipientId: string) {
    super(
      `Failed to cancel friend request from "${senderId}" to "${recipientId}"`,
    );
  }
}

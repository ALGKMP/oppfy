import type { Result } from "neverthrow";

import type { FriendStatus } from "@oppfy/db";

import type { FriendErrors } from "../../../errors/social/friend.error";

export interface IFriendService {
  isFollowing(options: {
    senderId: string;
    recipientId: string;
  }): Promise<Result<boolean, never>>;

  sendFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      | FriendErrors.RequestAlreadySent
      | FriendErrors.AlreadyFriends
      | FriendErrors.CannotFriendSelf
      | FriendErrors.FailedToSendRequest
    >
  >;

  acceptFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      FriendErrors.RequestNotFound | FriendErrors.FailedToAcceptRequest
    >
  >;

  declineFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      FriendErrors.RequestNotFound | FriendErrors.FailedToDeclineRequest
    >
  >;

  cancelFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      FriendErrors.RequestNotFound | FriendErrors.FailedToCancelRequest
    >
  >;

  getFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      { senderId: string; recipientId: string; createdAt: Date } | undefined,
      never
    >
  >;

  removeFriend(options: {
    targetUserId: string;
    otherUserId: string;
  }): Promise<
    Result<void, FriendErrors.NotFound | FriendErrors.FailedToRemove>
  >;

  countFriendRequests(options: {
    userId: string;
  }): Promise<Result<number, FriendErrors.FailedToCountRequests>>;

  determineFriendState(options: {
    userId: string;
    targetUserId: string;
  }): Promise<Result<FriendStatus, never>>;

  friendshipExists(options: {
    userIdA: string;
    userIdB: string;
  }): Promise<Result<boolean, never>>;
}

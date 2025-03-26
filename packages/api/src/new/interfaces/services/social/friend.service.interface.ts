import type { Result } from "neverthrow";

import type { FriendStatus } from "@oppfy/db";

import type { FriendErrors } from "../../../errors/social/friend.error";

export interface IsFollowingParams {
  senderId: string;
  recipientId: string;
}

export interface SendFriendRequestParams {
  senderId: string;
  recipientId: string;
}

export interface AcceptFriendRequestParams {
  senderId: string;
  recipientId: string;
}

export interface DeclineFriendRequestParams {
  senderId: string;
  recipientId: string;
}

export interface CancelFriendRequestParams {
  senderId: string;
  recipientId: string;
}

export interface GetFriendRequestParams {
  senderId: string;
  recipientId: string;
}

export interface RemoveFriendParams {
  targetUserId: string;
  otherUserId: string;
}

export interface CountFriendRequestsParams {
  userId: string;
}

export interface DetermineFriendStateParams {
  userId: string;
  targetUserId: string;
}

export interface FriendshipExistsParams {
  userIdA: string;
  userIdB: string;
}

export interface IFriendService {
  isFollowing(params: IsFollowingParams): Promise<Result<boolean, never>>;

  sendFriendRequest(
    params: SendFriendRequestParams,
  ): Promise<
    Result<
      void,
      | FriendErrors.RequestAlreadySent
      | FriendErrors.AlreadyFriends
      | FriendErrors.CannotFriendSelf
      | FriendErrors.FailedToSendRequest
    >
  >;

  acceptFriendRequest(
    params: AcceptFriendRequestParams,
  ): Promise<
    Result<
      void,
      FriendErrors.RequestNotFound | FriendErrors.FailedToAcceptRequest
    >
  >;

  declineFriendRequest(
    params: DeclineFriendRequestParams,
  ): Promise<
    Result<
      void,
      FriendErrors.RequestNotFound | FriendErrors.FailedToDeclineRequest
    >
  >;

  cancelFriendRequest(
    params: CancelFriendRequestParams,
  ): Promise<
    Result<
      void,
      FriendErrors.RequestNotFound | FriendErrors.FailedToCancelRequest
    >
  >;

  getFriendRequest(
    params: GetFriendRequestParams,
  ): Promise<
    Result<
      { senderId: string; recipientId: string; createdAt: Date } | undefined,
      never
    >
  >;

  removeFriend(
    params: RemoveFriendParams,
  ): Promise<Result<void, FriendErrors.NotFound | FriendErrors.FailedToRemove>>;

  countFriendRequests(
    params: CountFriendRequestsParams,
  ): Promise<Result<number, FriendErrors.FailedToCountRequests>>;

  determineFriendState(
    params: DetermineFriendStateParams,
  ): Promise<Result<FriendStatus, never>>;

  friendshipExists(
    params: FriendshipExistsParams,
  ): Promise<Result<boolean, never>>;
}

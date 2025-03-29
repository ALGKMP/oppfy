import type { Result } from "neverthrow";

import type { FriendError } from "../../../errors/social/friend.error";
import type { FriendRequest } from "../../../models";

export interface IsFollowingParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface SendFriendRequestParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface AcceptFriendRequestParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface DeclineFriendRequestParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface CancelFriendRequestParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface GetFriendRequestParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface RemoveFriendParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface IFriendService {
  isFollowing(params: IsFollowingParams): Promise<Result<boolean, never>>;

  sendFriendRequest(
    params: SendFriendRequestParams,
  ): Promise<Result<void, FriendError>>;

  acceptFriendRequest(
    params: AcceptFriendRequestParams,
  ): Promise<Result<void, FriendError>>;

  declineFriendRequest(
    params: DeclineFriendRequestParams,
  ): Promise<Result<void, FriendError>>;

  cancelFriendRequest(
    params: CancelFriendRequestParams,
  ): Promise<Result<void, FriendError>>;

  getFriendRequest(
    params: GetFriendRequestParams,
  ): Promise<Result<FriendRequest | undefined, never>>;

  removeFriend(params: RemoveFriendParams): Promise<Result<void, FriendError>>;
}

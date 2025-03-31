import type { Result } from "neverthrow";

import type { FriendError } from "../../../errors/social/friend.error";
import type { FriendRequest, Profile } from "../../../models";
import type {
  FriendStatus,
  PaginatedResponse,
  PaginationParams,
} from "../../types";

export interface PaginateByUserIdParams extends PaginationParams {
  userId: string;
}

export type PaginateResult = PaginatedResponse<
  Profile & {
    friendedAt: Date;
    friendStatus: FriendStatus;
  }
>;

export interface IFriendService {
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

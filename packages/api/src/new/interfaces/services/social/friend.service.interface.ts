import type { Result } from "neverthrow";

import type { FriendError } from "../../../errors/social/friend.error";
import type { Profile } from "../../../models";
import type {
  BidirectionalUserIdsparams,
  DirectionalUserIdsParams,
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
  friendUser(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendError>>;

  unfriendUser(
    params: BidirectionalUserIdsparams,
  ): Promise<Result<void, FriendError>>;

  acceptFriendRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendError>>;

  declineFriendRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendError>>;

  cancelFriendRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendError>>;

  paginateFriends(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginateResult, FriendError>>;

  paginateFriendRequests(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginateResult, FriendError>>;
}

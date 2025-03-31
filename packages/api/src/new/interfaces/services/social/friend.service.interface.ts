import type { Result } from "neverthrow";

import type { FriendError } from "../../../errors/social/friend.error";
import type { Profile } from "../../../models";
import type {
  BidirectionalUserIdsparams,
  DirectionalUserIdsParams,
  FollowStatus,
  FriendStatus,
  PaginatedResponse,
  PaginationParams,
} from "../../types";

export interface PaginateByUserIdParams extends PaginationParams {
  userId: string;
}

export type SocialProfile = Profile & {
  followedAt: Date;
  friendedAt: Date;
  followStatus: FollowStatus;
};

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
  ): Promise<Result<PaginatedResponse<SocialProfile>, FriendError>>;

  paginateFriendRequests(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginatedResponse<Profile>, FriendError>>;
}

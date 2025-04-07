import type { Result } from "neverthrow";

import type * as FriendErrors from "../../../errors/social/friend.error";
import { ProfileNotFound } from "../../../errors/user/profile.error";
import type { Profile } from "../../../models";
import type {
  BidirectionalUserIdsparams,
  DirectionalUserIdsParams,
  FollowStatus,
  PaginatedResponse,
  PaginationParams,
} from "../../types";

export type SocialProfile = Profile & {
  followedAt: Date;
  friendedAt: Date;
  followStatus: FollowStatus;
};

export interface PaginateByUserIdParams extends PaginationParams {
  userId: string;
}

export interface IFriendService {
  friendUser(
    params: DirectionalUserIdsParams,
  ): Promise<
    Result<
      void,
      | ProfileNotFound
      | FriendErrors.CannotFriendSelf
      | FriendErrors.AlreadyFriends
      | FriendErrors.RequestAlreadySent
    >
  >;

  unfriendUser(
    params: BidirectionalUserIdsparams,
  ): Promise<Result<void, FriendErrors.NotFound>>;

  acceptFriendRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendErrors.RequestNotFound>>;

  declineFriendRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendErrors.RequestNotFound>>;

  cancelFriendRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendErrors.RequestNotFound>>;

  paginateFriends(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginatedResponse<SocialProfile>, never>>;

  paginateFriendRequests(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginatedResponse<Profile>, never>>;
}

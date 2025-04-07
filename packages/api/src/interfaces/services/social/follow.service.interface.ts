import type { Result } from "neverthrow";

import type * as FollowErrors from "../../../errors/social/follow.error";
import type * as FriendErrors from "../../../errors/social/friend.error";
import type * as ProfileErrors from "../../../errors/user/profile.error";
import type { Profile } from "../../../models";
import type {
  DirectionalUserIdsParams,
  FollowStatus,
  PaginatedResponse,
  PaginationParams,
} from "../../types";

export type SocialProfile = Profile & {
  followedAt: Date;
  followStatus: FollowStatus;
};

export interface PaginateByUserIdParams extends PaginationParams {
  userId: string;
}

export interface IFollowService {
  followUser(
    params: DirectionalUserIdsParams,
  ): Promise<
    Result<
      void,
      | FollowErrors.CannotFollowSelf
      | ProfileErrors.ProfileNotFound
      | FollowErrors.AlreadyFollowing
      | FollowErrors.RequestAlreadySent
    >
  >;

  unfollowUser(
    params: DirectionalUserIdsParams,
  ): Promise<
    Result<void, FollowErrors.NotFollowing | FriendErrors.MustUnfriendFirst>
  >;

  removeFollower(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowErrors.NotFollowing>>;

  acceptFollowRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowErrors.RequestNotFound>>;

  declineFollowRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowErrors.RequestNotFound>>;

  cancelFollowRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowErrors.RequestNotFound>>;

  paginateFollowers(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginatedResponse<SocialProfile>, never>>;

  paginateFollowing(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginatedResponse<SocialProfile>, never>>;

  paginateFollowRequests(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginatedResponse<Profile>, never>>;
}

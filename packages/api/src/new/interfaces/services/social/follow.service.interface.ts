import type { Result } from "neverthrow";

import type { FollowError } from "../../../errors/social/follow.error";
import type { Profile } from "../../../models";
import type {
  DirectionalUserIdsParams,
  FollowStatus,
  PaginatedResponse,
  PaginationParams,
} from "../../types";

export interface PaginateByUserIdParams extends PaginationParams {
  userId: string;
}

export type SocialProfile = Profile & {
  followedAt: Date;
  followStatus: FollowStatus;
};

export interface IFollowService {
  followUser(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowError>>;

  unfollowUser(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowError>>;

  removeFollower(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowError>>;

  acceptFollowRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowError>>;

  declineFollowRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowError>>;

  cancelFollowRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FollowError>>;

  paginateFollowers(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginatedResponse<SocialProfile>, FollowError>>;

  paginateFollowing(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginatedResponse<SocialProfile>, FollowError>>;

  paginateFollowRequests(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginatedResponse<Profile>, FollowError>>;
}

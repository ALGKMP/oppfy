import type { Result } from "neverthrow";

import type { FollowError } from "../../../errors/social/follow.error";
import type { Profile } from "../../../models";
import type {
  DirectionalUserIdsParams,
  FollowStatus,
  PaginatedResponse,
  PaginationParams,
  Privacy,
} from "../../types";

export interface PaginateByUserIdParams extends PaginationParams {
  userId: string;
}

export type PaginateResult = PaginatedResponse<
  Profile & {
    followStatus: FollowStatus;
    privacy: Privacy;
  }
>;

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

  paginateFollowersSelf(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginateResult, FollowError>>;

  paginateFollowingSelf(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginateResult, FollowError>>;

  paginateFollowersOthers(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginateResult, FollowError>>;

  paginateFollowingOthers(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginateResult, FollowError>>;

  paginateFollowRequests(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginateResult, FollowError>>;
}

import type { Result } from "neverthrow";

import type { Transaction } from "@oppfy/db";

import type {
  FollowNotFoundError,
  FollowRequestNotFoundError,
  ProfileNotFoundError,
} from "../../../errors/social.errors";

export interface CreateFollowerParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface RemoveFollowerParams {
  followerId: string;
  followeeId: string;
}

export interface GetFollowerParams {
  followerId: string;
  followeeId: string;
}

export interface CountFollowersParams {
  userId: string;
}

export interface CountFollowingParams {
  userId: string;
}

export interface CountFollowRequestsParams {
  userId: string;
}

export interface DeleteFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface CreateFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface GetFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface AcceptFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface PaginateFollowersSelfParams {
  forUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface PaginateFollowersOthersParams {
  forUserId: string;
  currentUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface GetAllFollowingIdsParams {
  forUserId: string;
}

export interface PaginateFollowingSelfParams {
  userId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface PaginateFollowingOthersParams {
  forUserId: string;
  currentUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface PaginateFollowRequestsParams {
  forUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface FollowerResult {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  profileId: string;
  isFollowing?: boolean;
  isFollowRequested?: boolean;
}

export interface FollowRequestResult {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  profileId: string;
}

export interface IFollowRepository {
  createFollower(
    params: CreateFollowerParams,
    tx?: Transaction,
  ): Promise<Result<void, ProfileNotFoundError>>;

  removeFollower(
    params: RemoveFollowerParams,
    tx?: Transaction,
  ): Promise<Result<void, FollowNotFoundError | ProfileNotFoundError>>;

  removeFollowRequest(
    senderId: string,
    recipientId: string,
    tx?: Transaction,
  ): Promise<Result<void, FollowRequestNotFoundError>>;

  getFollower(
    params: GetFollowerParams,
    tx?: Transaction,
  ): Promise<Result<{ id: string } | undefined, never>>;

  countFollowers(
    params: CountFollowersParams,
    tx?: Transaction,
  ): Promise<Result<number | undefined, never>>;

  countFollowing(
    params: CountFollowingParams,
    tx?: Transaction,
  ): Promise<Result<number | undefined, never>>;

  countFollowRequests(
    params: CountFollowRequestsParams,
    tx?: Transaction,
  ): Promise<Result<number | undefined, never>>;

  deleteFollowRequest(
    params: DeleteFollowRequestParams,
    tx?: Transaction,
  ): Promise<Result<void, FollowRequestNotFoundError>>;

  createFollowRequest(
    params: CreateFollowRequestParams,
    tx?: Transaction,
  ): Promise<Result<void, never>>;

  getFollowRequest(
    params: GetFollowRequestParams,
    tx?: Transaction,
  ): Promise<Result<{ id: string } | undefined, never>>;

  acceptFollowRequest(
    params: AcceptFollowRequestParams,
    tx?: Transaction,
  ): Promise<Result<void, FollowRequestNotFoundError | ProfileNotFoundError>>;

  paginateFollowersSelf(
    params: PaginateFollowersSelfParams,
    tx?: Transaction,
  ): Promise<Result<FollowerResult[], never>>;

  paginateFollowersOthers(
    params: PaginateFollowersOthersParams,
    tx?: Transaction,
  ): Promise<Result<FollowerResult[], never>>;

  getAllFollowingIds(
    params: GetAllFollowingIdsParams,
    tx?: Transaction,
  ): Promise<Result<string[], never>>;

  paginateFollowingSelf(
    params: PaginateFollowingSelfParams,
    tx?: Transaction,
  ): Promise<Result<FollowerResult[], never>>;

  paginateFollowingOthers(
    params: PaginateFollowingOthersParams,
    tx?: Transaction,
  ): Promise<Result<FollowerResult[], never>>;

  paginateFollowRequests(
    params: PaginateFollowRequestsParams,
    tx?: Transaction,
  ): Promise<Result<FollowRequestResult[], never>>;
}

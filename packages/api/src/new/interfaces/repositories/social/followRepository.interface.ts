import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Profile } from "../../../models";

export interface FollowParams {
  followerId: string;
  followeeId: string;
}

export interface UserIdParams {
  userId: string;
}

export interface PaginationParams {
  cursor?: { createdAt: Date; userId: string } | null;
  limit?: number;
}

export interface PaginateFollowParams extends PaginationParams {
  userId: string;
  currentUserId?: string;
}

export interface FollowResult extends Profile {
  isFollowing?: boolean;
  isFollowRequested?: boolean;
}

export interface IFollowRepository {
  createFollower(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  removeFollower(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  createFollowRequest(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteFollowRequest(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  acceptFollowRequest(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  isFollowing(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<boolean>;

  isFollowRequested(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<boolean>;

  countFollowers(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<number>;

  countFollowing(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<number>;

  countFollowRequests(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<number>;

  paginateFollowers(
    params: PaginateFollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;

  paginateFollowing(
    params: PaginateFollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;

  paginateFollowRequests(
    params: PaginateFollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;
}

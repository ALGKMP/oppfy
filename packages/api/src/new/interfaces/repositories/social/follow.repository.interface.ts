import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Follow, Profile } from "../../../models";

export interface UserIdParams {
  userId: string;
}

export interface FollowParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface PaginationParams {
  cursor?: { createdAt: Date; userId: string } | null;
  limit?: number;
}

export interface PaginateFollowParams extends PaginationParams {
  otherUserId: string;
  selfUserId?: string;
}

export interface GetFollowParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface IFollowRepository {
  createFollower(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  getFollower(
    params: GetFollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<Follow | undefined>;

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

  isFollowRequested(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<boolean>;

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

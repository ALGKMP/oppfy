import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Follow, FollowRequest, Profile } from "../../../models";

export interface UserIdsParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface CleanupFollowRelationshipsParams {
  userIdA: string;
  userIdB: string;
}

export interface PaginationParams {
  cursor?: { createdAt: Date; userId: string } | null;
  limit?: number;
}

export interface PaginateFollowParams extends PaginationParams {
  otherUserId: string;
  selfUserId?: string;
}

export interface SocialProfile extends Profile {
  followedAt: Date;
}

export interface IFollowRepository {
  getFollower(
    params: UserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<Follow | undefined>;

  getFollowRequest(
    params: UserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<FollowRequest | undefined>;

  createFollower(
    params: UserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  createFollowRequest(
    params: UserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteFollower(
    params: UserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteFollowRequest(
    params: UserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  cleanupFollowRelationships(
    params: CleanupFollowRelationshipsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  paginateFollowers(
    params: PaginateFollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<SocialProfile[]>;

  paginateFollowing(
    params: PaginateFollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<SocialProfile[]>;

  paginateFollowRequests(
    params: PaginateFollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<SocialProfile[]>;
}

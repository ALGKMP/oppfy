import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";

import type { Follow, FollowRequest, Profile } from "../../../models";
import type { FollowStatus } from "../../types";

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
  userId: string;
}

export interface SocialProfile extends Profile {
  followedAt: Date;
  followStatus: FollowStatus;
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

  createFollower(params: UserIdsParams, tx: Transaction): Promise<void>;

  createFollowRequest(params: UserIdsParams, tx: Transaction): Promise<void>;

  deleteFollower(params: UserIdsParams, tx: Transaction): Promise<void>;

  deleteFollowRequest(params: UserIdsParams, tx: Transaction): Promise<void>;

  cleanupFollowRelationships(
    params: CleanupFollowRelationshipsParams,
    tx: Transaction,
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
  ): Promise<Profile[]>;
}

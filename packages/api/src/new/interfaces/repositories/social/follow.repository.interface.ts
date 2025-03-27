import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Follow, Profile } from "../../../models";

export interface UserIdParams {
  userId: string;
}

export interface FollowParams {
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

export interface GetFollowParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface GetFollowRequestParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface SocialProfile {
  profile: Profile;
  createdAt: Date;
}

export interface IFollowRepository {
  getFollower(
    params: GetFollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<Follow | undefined>;

  getFollowRequest(
    params: GetFollowRequestParams,
    db?: DatabaseOrTransaction,
  ): Promise<Follow | undefined>;

  createFollower(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  createFollowRequest(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteFollower(
    params: FollowParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteFollowRequest(
    params: FollowParams,
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

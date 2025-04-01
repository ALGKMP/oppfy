import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";

import type { Follow, FollowRequest, Profile } from "../../../models";
import type {
  BidirectionalUserIdsparams,
  DirectionalUserIdsParams,
  FollowStatus,
  PaginationParams,
} from "../../types";

export interface SocialProfile extends Profile {
  followedAt: Date;
  followStatus: FollowStatus;
}

export interface PaginateFollowParams extends PaginationParams {
  userId: string;
}

export interface IFollowRepository {
  getFollower(
    params: DirectionalUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<Follow | undefined>;

  getFollowRequest(
    params: DirectionalUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<FollowRequest | undefined>;

  createFollower(
    params: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void>;

  createFollowRequest(
    params: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void>;

  deleteFollower(
    params: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void>;

  deleteFollowRequest(
    params: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void>;

  cleanupFollowRelationships(
    params: BidirectionalUserIdsparams,
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

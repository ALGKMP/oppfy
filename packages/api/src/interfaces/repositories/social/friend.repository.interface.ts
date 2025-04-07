import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";

import type { Friend, FriendRequest, Profile } from "../../../models";
import type {
  BidirectionalUserIdsparams,
  DirectionalUserIdsParams,
  FollowStatus,
  PaginationParams,
} from "../../types";

export interface SocialProfile extends Profile {
  followedAt: Date;
  friendedAt: Date;
  followStatus: FollowStatus;
}

export interface PaginateFriendParams extends PaginationParams {
  userId: string;
}

export interface IFriendRepository {
  getFriend(
    params: BidirectionalUserIdsparams,
    db?: DatabaseOrTransaction,
  ): Promise<Friend | undefined>;

  getFriendRequest(
    params: DirectionalUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<FriendRequest | undefined>;

  createFriend(
    params: BidirectionalUserIdsparams,
    tx: Transaction,
  ): Promise<void>;

  createFriendRequest(
    params: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void>;

  deleteFriend(
    params: BidirectionalUserIdsparams,
    tx: Transaction,
  ): Promise<void>;

  deleteFriendRequest(
    params: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void>;

  cleanupFriendRelationships(
    params: BidirectionalUserIdsparams,
    tx: Transaction,
  ): Promise<void>;

  paginateFriends(
    params: PaginateFriendParams,
    db?: DatabaseOrTransaction,
  ): Promise<SocialProfile[]>;

  paginateFriendRequests(
    params: PaginateFriendParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;
}

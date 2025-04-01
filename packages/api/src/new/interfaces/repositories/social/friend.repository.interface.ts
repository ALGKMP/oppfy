import type { DatabaseOrTransaction } from "@oppfy/db";

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

  createFriend(
    params: BidirectionalUserIdsparams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteFriend(
    params: BidirectionalUserIdsparams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  getFriendRequest(
    params: DirectionalUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<FriendRequest | undefined>;

  createFriendRequest(
    params: DirectionalUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteFriendRequest(
    params: DirectionalUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  cleanupFriendRelationships(
    params: BidirectionalUserIdsparams,
    db?: DatabaseOrTransaction,
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

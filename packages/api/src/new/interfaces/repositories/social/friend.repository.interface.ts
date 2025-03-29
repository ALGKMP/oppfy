import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";

import type { Friend, FriendRequest, Profile } from "../../../models";

export interface UserIdParams {
  userId: string;
}
export interface FriendParams {
  userIdA: string;
  userIdB: string;
}

export interface FriendRequestParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface PaginationParams {
  cursor?: { createdAt: Date; userId: string } | null;
  limit?: number;
}

export interface PaginateFriendParams extends PaginationParams {
  userId: string;
}

export interface SocialProfile extends Profile {
  friendedAt: Date;
}

export interface IFriendRepository {
  getFriend(
    params: FriendParams,
    db?: DatabaseOrTransaction,
  ): Promise<Friend | undefined>;

  createFriend(params: FriendParams, db?: DatabaseOrTransaction): Promise<void>;

  deleteFriend(params: FriendParams, db?: DatabaseOrTransaction): Promise<void>;

  getFriendRequest(
    params: FriendRequestParams,
    db?: DatabaseOrTransaction,
  ): Promise<FriendRequest | undefined>;

  createFriendRequest(
    params: FriendRequestParams,
    tx: Transaction,
  ): Promise<void>;

  deleteFriendRequest(
    params: FriendRequestParams,
    tx: Transaction,
  ): Promise<void>;

  cleanupFriendRelationships(
    params: FriendParams,
    tx: Transaction,
  ): Promise<void>;

  paginateFriends(
    params: PaginateFriendParams,
    db?: DatabaseOrTransaction,
  ): Promise<SocialProfile[]>;

  paginateFriendRequests(
    params: PaginateFriendParams,
    db?: DatabaseOrTransaction,
  ): Promise<SocialProfile[]>;
}

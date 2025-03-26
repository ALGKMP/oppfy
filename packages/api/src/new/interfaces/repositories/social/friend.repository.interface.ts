import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Profile } from "../../../models";

export interface UserIdParams {
  userId: string;
}
export interface FriendParams {
  userIdA: string;
  userIdB: string;
}

export interface FriendRequestParams {
  senderId: string;
  recipientId: string;
}

export interface PaginationParams {
  cursor?: { createdAt: Date; userId: string } | null;
  limit?: number;
}

export interface PaginateFriendParams extends PaginationParams {
  userId: string;
}

export interface IFriendRepository {
  createFriend(params: FriendParams, db?: DatabaseOrTransaction): Promise<void>;

  removeFriend(params: FriendParams, db?: DatabaseOrTransaction): Promise<void>;

  createFriendRequest(
    params: FriendRequestParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteFriendRequest(
    params: FriendRequestParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  isFriends(params: FriendParams, db?: DatabaseOrTransaction): Promise<boolean>;

  isFriendRequested(
    params: FriendRequestParams,
    db?: DatabaseOrTransaction,
  ): Promise<boolean>;

  countFriends(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<number>;

  countFriendRequests(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<number>;

  paginateFriends(
    params: PaginateFriendParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;

  paginateFriendRequests(
    params: PaginateFriendParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;
}

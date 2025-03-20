import type { Transaction } from "@oppfy/db";

import type { UserStats } from "../../../models";

export interface DecrementFollowerCountParams {
  userId: string;
  amount: number;
}

export interface DecrementFollowingCountParams {
  userId: string;
  amount: number;
}

export interface DecrementFriendsCountParams {
  userId: string;
  amount: number;
}

export interface DecrementPostsCountParams {
  userId: string;
  decrementBy: number;
}

export interface IncrementFollowerCountParams {
  userId: string;
  incrementBy: number;
}

export interface IncrementFollowingCountParams {
  userId: string;
  incrementBy: number;
}

export interface IncrementFriendsCountParams {
  userId: string;
  incrementBy: number;
}

export interface IncrementPostsCountParams {
  userId: string;
  incrementBy: number;
}

export interface GetUserStatsParams {
  userId: string;
}

export interface IUserStatsRepository {
  decrementFollowerCount(
    params: DecrementFollowerCountParams,
    tx?: Transaction,
  ): Promise<void>;

  decrementFollowingCount(
    params: DecrementFollowingCountParams,
    tx?: Transaction,
  ): Promise<void>;

  decrementFriendsCount(
    params: DecrementFriendsCountParams,
    tx?: Transaction,
  ): Promise<void>;

  decrementPostsCount(
    params: DecrementPostsCountParams,
    tx?: Transaction,
  ): Promise<void>;

  incrementFollowerCount(
    params: IncrementFollowerCountParams,
    tx?: Transaction,
  ): Promise<void>;

  incrementFollowingCount(
    params: IncrementFollowingCountParams,
    tx?: Transaction,
  ): Promise<void>;

  incrementFriendsCount(
    params: IncrementFriendsCountParams,
    tx?: Transaction,
  ): Promise<void>;

  incrementPostsCount(
    params: IncrementPostsCountParams,
    tx?: Transaction,
  ): Promise<void>;

  getUserStats(
    params: GetUserStatsParams,
    tx?: Transaction,
  ): Promise<UserStats | undefined>;
}

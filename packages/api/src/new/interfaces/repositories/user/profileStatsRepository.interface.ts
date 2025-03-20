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
  profileId: string;
  decrementBy: number;
}

export interface IncrementFollowerCountParams {
  profileId: string;
  incrementBy: number;
}

export interface IncrementFollowingCountParams {
  profileId: string;
  incrementBy: number;
}

export interface IncrementFriendsCountParams {
  profileId: string;
  incrementBy: number;
}

export interface IncrementPostsCountParams {
  profileId: string;
  incrementBy: number;
}

export interface GetProfileStatsParams {
  profileId: string;
}

export interface IProfileStatsRepository {
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

  getProfileStats(
    params: GetProfileStatsParams,
    tx?: Transaction,
  ): Promise<UserStats | undefined>;
}

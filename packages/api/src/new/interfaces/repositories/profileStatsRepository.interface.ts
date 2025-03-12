import type { Transaction } from "@oppfy/db";

import type { ProfileStats } from "../../models";

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
    db?: Transaction,
  ): Promise<void>;

  decrementFollowingCount(
    params: DecrementFollowingCountParams,
    db?: Transaction,
  ): Promise<void>;

  decrementFriendsCount(
    params: DecrementFriendsCountParams,
    db?: Transaction,
  ): Promise<void>;

  decrementPostsCount(
    params: DecrementPostsCountParams,
    db?: Transaction,
  ): Promise<void>;

  incrementFollowerCount(
    params: IncrementFollowerCountParams,
    db?: Transaction,
  ): Promise<void>;

  incrementFollowingCount(
    params: IncrementFollowingCountParams,
    db?: Transaction,
  ): Promise<void>;

  incrementFriendsCount(
    params: IncrementFriendsCountParams,
    db?: Transaction,
  ): Promise<void>;

  incrementPostsCount(
    params: IncrementPostsCountParams,
    db?: Transaction,
  ): Promise<void>;

  getProfileStats(
    params: GetProfileStatsParams,
    db?: Transaction,
  ): Promise<ProfileStats | undefined>;
}

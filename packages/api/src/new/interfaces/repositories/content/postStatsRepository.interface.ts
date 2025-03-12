import type { Transaction } from "@oppfy/db";

export interface UpdatePostStatsParams {
  postId: string;
}

export interface IPostStatsRepository {
  incrementCommentsCount(
    params: UpdatePostStatsParams,
    tx?: Transaction,
  ): Promise<void>;
  decrementCommentsCount(
    params: UpdatePostStatsParams,
    tx?: Transaction,
  ): Promise<void>;
  incrementLikesCount(
    params: UpdatePostStatsParams,
    tx?: Transaction,
  ): Promise<void>;
  decrementLikesCount(
    params: UpdatePostStatsParams,
    tx?: Transaction,
  ): Promise<void>;
}

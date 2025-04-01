import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";

import type { Like } from "../../../models";

export interface LikeParams {
  userId: string;
  postId: string;
}

export interface ILikeRepository {
  getLike(
    params: LikeParams,
    db?: DatabaseOrTransaction,
  ): Promise<Like | undefined>;
  createLike(params: LikeParams, tx: Transaction): Promise<void>;
  deleteLike(params: LikeParams, tx: Transaction): Promise<void>;
}

import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Like } from "../../../models";

export interface LikeParams {
  postId: string;
  userId: string;
}

export interface ILikeRepository {
  addLike(params: LikeParams, db?: DatabaseOrTransaction): Promise<void>;
  removeLike(params: LikeParams, db?: DatabaseOrTransaction): Promise<void>;
  findLike(
    params: LikeParams,
    db?: DatabaseOrTransaction,
  ): Promise<Like | undefined>;
}

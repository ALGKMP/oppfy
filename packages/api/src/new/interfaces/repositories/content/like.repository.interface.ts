import type { Transaction } from "@oppfy/db";

import type { Like } from "../../../models";

export interface LikeParams {
  postId: string;
  userId: string;
}

export interface ILikeRepository {
  addLike(params: LikeParams, tx?: Transaction): Promise<void>;
  removeLike(params: LikeParams, tx?: Transaction): Promise<void>;
  findLike(params: LikeParams, tx?: Transaction): Promise<Like | undefined>;
}
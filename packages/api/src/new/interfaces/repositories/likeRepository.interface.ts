// interfaces/repositories/likeRepository.interface.ts
import type { Transaction } from "@oppfy/db";

import type { Like } from "../../models";

export interface AddLikeParams {
  postId: string;
  userId: string;
}

export interface RemoveLikeParams {
  postId: string;
  userId: string;
}

export interface FindLikeParams {
  postId: string;
  userId: string;
}

export interface ILikeRepository {
  addLike(params: AddLikeParams, tx?: Transaction): Promise<void>;
  removeLike(params: RemoveLikeParams, tx?: Transaction): Promise<void>;
  findLike(params: FindLikeParams, tx?: Transaction): Promise<Like | undefined>;
}

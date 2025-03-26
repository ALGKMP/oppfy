import type { DatabaseOrTransaction } from "@oppfy/db";

export interface LikeParams {
  postId: string;
  userId: string;
}

export interface ILikeRepository {
  addLike(params: LikeParams, db?: DatabaseOrTransaction): Promise<void>;
  removeLike(params: LikeParams, db?: DatabaseOrTransaction): Promise<void>;
  isLiked(params: LikeParams, db?: DatabaseOrTransaction): Promise<boolean>;
}

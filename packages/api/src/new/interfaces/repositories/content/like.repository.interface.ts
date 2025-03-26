import type { DatabaseOrTransaction } from "@oppfy/db";
import type { Like } from "../../../models";

export interface LikeParams {
  postId: string;
  userId: string;
}

export interface ILikeRepository {
  getLike(params: LikeParams, db?: DatabaseOrTransaction): Promise<Like | undefined>;
  addLike(params: LikeParams, db?: DatabaseOrTransaction): Promise<void>;
  removeLike(params: LikeParams, db?: DatabaseOrTransaction): Promise<void>;
  isLiked(params: LikeParams, db?: DatabaseOrTransaction): Promise<boolean>;
}

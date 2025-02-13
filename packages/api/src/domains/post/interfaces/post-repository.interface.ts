import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { schema } from "@oppfy/db";

export type Post = InferSelectModel<typeof schema.post>;
export type InsertPost = InferInsertModel<typeof schema.post>;
export type PostStats = InferSelectModel<typeof schema.postStats>;

export interface IPostRepository {
  getPostById(postId: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post | undefined>;
  deletePost(postId: string): Promise<void>;
  getPostsByUserId(userId: string): Promise<Post[]>;
  getPostsByRecipientId(recipientId: string): Promise<Post[]>;
  // Add other post-specific methods
}

export interface IPostStatsRepository {
  incrementCommentsCount(postId: string): Promise<void>;
  decrementCommentsCount(postId: string): Promise<void>;
  incrementLikesCount(postId: string): Promise<void>;
  decrementLikesCount(postId: string): Promise<void>;
  getPostStats(postId: string): Promise<PostStats | undefined>;
  // Add other stats-specific methods
}

export interface IPostLikeRepository {
  getLike(userId: string, postId: string): Promise<boolean>;
  createLike(params: { userId: string; postId: string }): Promise<void>;
  deleteLike(userId: string, postId: string): Promise<void>;
  // Add other like-specific methods
}

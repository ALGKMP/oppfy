import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { schema } from "@oppfy/db";

export type Post = InferSelectModel<typeof schema.post>;
export type InsertPost = InferInsertModel<typeof schema.post>;
export type PostStats = InferSelectModel<typeof schema.postStats>;
export type Like = InferSelectModel<typeof schema.like>;

export interface IPostRepository {
  getPostById(postId: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  getPostsByUserId(userId: string): Promise<Post[]>;
  getPostsByRecipientId(recipientId: string): Promise<Post[]>;
  getPaginatedPosts(params: {
    cursor?: { createdAt: Date; id: string };
    limit: number;
    userId: string;
  }): Promise<Post[]>;
}

export interface IPostStatsRepository {
  incrementCommentsCount(postId: string): Promise<void>;
  decrementCommentsCount(postId: string): Promise<void>;
  incrementLikesCount(postId: string): Promise<void>;
  decrementLikesCount(postId: string): Promise<void>;
  getPostStats(postId: string): Promise<PostStats | undefined>;
  createPostStats(postId: string): Promise<PostStats>;
  incrementViewsCount(postId: string): Promise<void>;
}

export interface IPostLikeRepository {
  getLike(userId: string, postId: string): Promise<boolean>;
  createLike(params: { userId: string; postId: string }): Promise<Like>;
  deleteLike(userId: string, postId: string): Promise<void>;
  getLikesByPostId(postId: string): Promise<Like[]>;
  getLikesByUserId(userId: string): Promise<Like[]>;
}

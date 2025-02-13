import { eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../../errors";
import type { IPostRepository, Post, InsertPost } from "../interfaces/post-repository.interface";

export class PostRepository implements IPostRepository {
  private db = db;

  @handleDatabaseErrors
  async getPostById(postId: string): Promise<Post | undefined> {
    return await this.db.query.post.findFirst({
      where: eq(schema.post.id, postId),
    });
  }

  @handleDatabaseErrors
  async createPost(post: InsertPost): Promise<Post | undefined> {
    const [newPost] = await this.db
      .insert(schema.post)
      .values(post)
      .returning();
    return newPost;
  }

  @handleDatabaseErrors
  async deletePost(postId: string): Promise<void> {
    await this.db.delete(schema.post).where(eq(schema.post.id, postId));
  }

  @handleDatabaseErrors
  async getPostsByUserId(userId: string): Promise<Post[]> {
    return await this.db.query.post.findMany({
      where: eq(schema.post.authorId, userId),
    });
  }

  @handleDatabaseErrors
  async getPostsByRecipientId(recipientId: string): Promise<Post[]> {
    return await this.db.query.post.findMany({
      where: eq(schema.post.recipientId, recipientId),
    });
  }
}

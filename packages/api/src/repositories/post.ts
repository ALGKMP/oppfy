import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class PostRepository {
  private db = db;

  @handleDatabaseErrors
  async createPost(
    key: string,
    author: string,
    recipient: string,
    caption: string,
  ) {
    return await this.db
      .insert(schema.post)
      .values({
        key,
        author,
        recipient,
        caption,
      })
      .execute();
  }

  @handleDatabaseErrors
  async getPost(postId: number) {
    return await this.db.query.post.findFirst({
      where: eq(schema.post.id, postId),
    });
  }

  @handleDatabaseErrors
  async getAllPosts(userId: string) {
    return await this.db.query.post.findMany({
      where: eq(schema.post.author, userId),
    });
  }

  @handleDatabaseErrors
  async updatePost(postId: number, newCaption: string) {
    await this.db
      .update(schema.post)
      .set({ caption: newCaption })
      .where(eq(schema.post.id, postId));
  }

  @handleDatabaseErrors
  async createPostStats(postId: number) {
    return await this.db.insert(schema.postStats).values({ postId });
  }

  @handleDatabaseErrors
  async deletePost(postId: number) {
    await this.db.delete(schema.post).where(eq(schema.post.id, postId));
  }
}

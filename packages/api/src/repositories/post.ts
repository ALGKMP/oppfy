import { db, schema } from "@acme/db";
import { and, eq, gt, or, asc } from 'drizzle-orm';


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
  async getPaginatedUserPosts(
    userId: string,
    cursor: { createdAt: Date; postId: number } | null = null,
    pageSize = 10,
  ) {
    return await this.db
      .select({
        postId: schema.post.id,
        authorId: schema.post.author,
        recipientId: schema.post.recipient,
        caption: schema.post.caption,
        imageUrl: schema.post.key,
        createdAt: schema.post.createdAt,
        profileId: schema.profile.id, // Assuming this links back to the user
        commentsCount: schema.postStats.comments,
        likesCount: schema.postStats.likes,
      })
      .from(schema.post)
      .innerJoin(schema.postStats, eq(schema.post.id, schema.postStats.postId))
      .innerJoin(schema.user, eq(schema.post.author, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.user.id, userId),
          cursor
            ? or(
                gt(schema.post.createdAt, cursor.createdAt),
                and(
                  eq(schema.post.createdAt, cursor.createdAt),
                  gt(schema.post.id, cursor.postId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(schema.post.createdAt), // Primary order by the creation date
        asc(schema.post.id), // Tiebreaker order by post ID
      )
      .limit(pageSize + 1); // Fetch an extra item to check if there's a next page
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

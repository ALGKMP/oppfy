import { aliasedTable, and, asc, eq, gt, or } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

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
    return await this.db.insert(schema.post).values({
      key,
      author,
      recipient,
      caption,
    });
  }

  @handleDatabaseErrors
  async getPost(postId: number) {
    return await this.db.query.post.findFirst({
      where: eq(schema.post.id, postId),
    });
  }

  // TODO: Test This
  @handleDatabaseErrors
  async getPaginatedPosts(
    userId: string,
    cursor: { createdAt: Date; postId: number } | null = null,
    pageSize = 10,
  ) {
    const author = aliasedTable(schema.user, "author");
    const recipient = aliasedTable(schema.user, "recipient");
    const authorProfile = aliasedTable(schema.profile, "authorProfile");
    const recipientProfile = aliasedTable(schema.profile, "recipientProfile");
  
    return await this.db
      .select({
        postId: schema.post.id,
        authorId: schema.post.author,
        authorUsername: authorProfile.username,
        authorProfilePicture: authorProfile.profilePictureKey,
        recipientId: schema.post.recipient,
        recipientUsername: recipientProfile.username,
        recipientProfilePicture: recipientProfile.profilePictureKey,
        caption: schema.post.caption,
        imageUrl: schema.post.key,
        commentsCount: schema.postStats.comments,
        likesCount: schema.postStats.likes,
        createdAt: schema.post.createdAt,
      })
      .from(schema.post)
      .innerJoin(schema.postStats, eq(schema.post.id, schema.postStats.postId))
      .innerJoin(author, eq(schema.post.author, author.id))
      .innerJoin(authorProfile, eq(author.profileId, authorProfile.id))
      .innerJoin(recipient, eq(schema.post.recipient, recipient.id))
      .innerJoin(recipientProfile, eq(recipient.profileId, recipientProfile.id))
      .where(
        and(
          eq(schema.post.recipient, userId),
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

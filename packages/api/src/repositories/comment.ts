import { db, schema } from "@acme/db";
import { handleDatabaseErrors } from "../errors";

import { eq } from "@acme/db";

export class CommentRepository {
  private db = db;

  @handleDatabaseErrors
  async addComment(postId: number, userId: string, body: string) {
    return await this.db.insert(schema.comment).values({
      post: postId,
      user: userId,
      body: body,
      createdAt: new Date(),
    });
  }

  @handleDatabaseErrors
  async removeComment(commentId: number) {
    return await this.db.delete(schema.comment).where(eq(schema.comment.id, commentId));
  }
}

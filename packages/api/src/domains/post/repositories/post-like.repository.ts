import { and, eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../../errors";
import type {
  IPostLikeRepository,
  Like,
} from "../interfaces/post-repository.interface";

export class PostLikeRepository implements IPostLikeRepository {
  private db = db;

  @handleDatabaseErrors
  async getLike(userId: string, postId: string): Promise<boolean> {
    const like = await this.db.query.like.findFirst({
      where: and(
        eq(schema.like.userId, userId),
        eq(schema.like.postId, postId),
      ),
    });
    return !!like;
  }

  @handleDatabaseErrors
  async createLike(params: { userId: string; postId: string }): Promise<Like> {
    const [like] = await this.db.insert(schema.like).values(params).returning();

    if (!like) {
      throw new Error("Failed to create like");
    }

    return like;
  }

  @handleDatabaseErrors
  async deleteLike(userId: string, postId: string): Promise<void> {
    await this.db
      .delete(schema.like)
      .where(
        and(eq(schema.like.userId, userId), eq(schema.like.postId, postId)),
      );
  }

  @handleDatabaseErrors
  async getLikesByPostId(postId: string): Promise<Like[]> {
    return await this.db.query.like.findMany({
      where: eq(schema.like.postId, postId),
      with: {
        likedBy: {
          with: {
            profile: true,
          },
        },
      },
    });
  }

  @handleDatabaseErrors
  async getLikesByUserId(userId: string): Promise<Like[]> {
    return await this.db.query.like.findMany({
      where: eq(schema.like.userId, userId),
      with: {
        post: {
          with: {
            author: {
              with: {
                profile: true,
              },
            },
            recipient: {
              with: {
                profile: true,
              },
            },
            postStats: true,
          },
        },
      },
    });
  }
}

import { and, asc, eq, gt, or } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../../errors";
import type {
  InsertPost,
  IPostRepository,
  Post,
} from "../interfaces/post-repository.interface";

export class PostRepository implements IPostRepository {
  private db = db;

  @handleDatabaseErrors
  async getPostById(postId: string): Promise<Post | undefined> {
    return await this.db.query.post.findFirst({
      where: eq(schema.post.id, postId),
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
    });
  }

  @handleDatabaseErrors
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await this.db
      .insert(schema.post)
      .values(post)
      .returning();

    if (!newPost) {
      throw new Error("Failed to create post");
    }

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
      orderBy: [asc(schema.post.createdAt)],
    });
  }

  @handleDatabaseErrors
  async getPostsByRecipientId(recipientId: string): Promise<Post[]> {
    return await this.db.query.post.findMany({
      where: eq(schema.post.recipientId, recipientId),
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
      orderBy: [asc(schema.post.createdAt)],
    });
  }

  @handleDatabaseErrors
  async getPaginatedPosts(params: {
    cursor?: { createdAt: Date; id: string };
    limit: number;
    userId: string;
  }): Promise<Post[]> {
    return await this.db.query.post.findMany({
      where: and(
        eq(schema.post.recipientId, params.userId),
        params.cursor
          ? or(
              gt(schema.post.createdAt, params.cursor.createdAt),
              and(
                eq(schema.post.createdAt, params.cursor.createdAt),
                gt(schema.post.id, params.cursor.id),
              ),
            )
          : undefined,
      ),
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
      orderBy: [asc(schema.post.createdAt), asc(schema.post.id)],
      limit: params.limit + 1, // Get an extra item to determine if there are more results
    });
  }
}

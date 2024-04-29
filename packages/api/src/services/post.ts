// src/service/PostService.ts
import Services from ".";
import Repositories from "../repositories";

const PostService = {
  createPost: async (
    author: string,
    friend: string,
    caption: string,
    objectKey: string,
  ) => {
    try {
      const postId = await Repositories.post.createPost(
        author,
        friend,
        caption,
        objectKey,
      );
      if (!postId) {
        throw new Error("Failed to create post.");
      }
      return await Repositories.post.createPostStats(postId);
    } catch (error) {
      console.error("Failed to create post:", error);
      throw new Error("Error creating post.");
    }
  },

  editPost: async (postId: number, newCaption: string) => {
    try {
      return await Repositories.post.updatePost(postId, newCaption);
    } catch (error) {
      console.error("Failed to edit post:", error);
      throw new Error("Error editing post.");
    }
  },

  getPost: async (postId: number) => {
    try {
      const post = await Repositories.post.getPost(postId);
      if (!post) {
        throw new Error(`Post with key ${postId} not found.`);
      }
      return post;
    } catch (error) {
      console.error("Failed to retrieve post:", error);
      throw error; // Re-throw the same error or a new one if needed
    }
  },

  getUserPosts: async (userId: string) => {
    const bucket = process.env.S3_BUCKET_NAME!;
    try {
      const posts = await Repositories.post.allUserPosts(userId);
      const results: Record<number, string | null> = {};

      const urlPromises = posts.map(async (post) => {
        try {
          const url = await Services.aws.objectPresignedUrl(
            bucket,
            `posts/${post.key}.jpg`,
          );
          results[post.id] = url;  // Store URL with postId as key
        } catch (err) {
          console.error(
            `Error retrieving post: posts/${post.id}.jpg`,
            err,
          );
          return `Failed to retrieve object from S3 for post ${post.id}`;
        }
      });
      await Promise.all(urlPromises);
      return results;
    } catch (error) {
      console.error("Failed to get batch posts:", error);
      throw new Error("Error retrieving batch posts.");
    }
  },

  deletePost: async (postId: number) => {
    try {
      await Repositories.post.deletePost(postId);
      return;
    } catch (error) {
      console.error("Failed to delete post:", error);
      throw new Error("Error deleting post.");
    }
  },

  getPostsBatch: async (postIds: number[]): Promise<Record<number, string | null>> => {
    const bucket = process.env.S3_BUCKET_NAME!;
    try {
      const results: Record<number, string | null> = {};
      const urlPromises = postIds.map(async (postId) => {
        try {
          const post = await Repositories.post.getPost(postId);
          if (!post) {
            throw new Error(`Post with key ${postId} not found`);
          }
          const url = await Services.aws.objectPresignedUrl(
            bucket,
            `post/${post.key}.jpg`,
          );
          results[postId] = url;  // Store URL with postId as key
        } catch (err) {
          console.error(
            `Error retrieving post: post/${postId}.jpg`,
            err,
          );
          return `Failed to retrieve object from S3 for post ${postId}`;
        }
      });
      await Promise.all(urlPromises);
      return results;
    } catch (error) {
      console.error("Failed to get batch posts:", error);
      throw new Error("Error retrieving batch posts.");
    }
  },
};

export default PostService;

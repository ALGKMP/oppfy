// src/service/PostService.ts
import Repositories from "../repository";
import Services from ".";
import { TRPCError } from "@trpc/server";

const PostService = {
  createPost: async (author: string, recipient: string, caption: string, objectKey: string) => {
    try {
      return await Repositories.post.createPost(author, recipient, caption, objectKey);
    } catch (error) {
      console.error("Failed to create post:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error creating post.' });
    }
  },

  editPost: async (key: string, newCaption: string) => {
    try {
      return await Repositories.post.updatePost(key, newCaption);
    } catch (error) {
      console.error("Failed to edit post:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error editing post.' });
    }
  },

  getPost: async (key: string) => {
    try {
      const post = await Repositories.post.getPostByKey(key);
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Post with key ${key} not found.` });
      }
      return post;
    } catch (error) {
      console.error("Failed to retrieve post:", error);
      throw error; // Re-throw the same error or a new one if needed
    }
  },

  deletePost: async (key: string) => {
    try {
      return await Repositories.post.deletePost(key);
    } catch (error) {
      console.error("Failed to delete post:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error deleting post.' });
    }
  },

  getBatchPosts: async (keys: string[]) => {
    const bucket = process.env.S3_BUCKET_NAME!;
    try {
      const urlPromises = keys.map(async (postKey) => {
        try {
          const post = await Repositories.post.getPostByKey(postKey);
          if (!post) {
            throw new Error(`Post with key ${postKey} not found`);
          }
          return await Services.aws.objectPresignedUrl(
            bucket,
            `post-images/${postKey}.jpg`,
          );
        } catch (err) {
          console.error(`Error retrieving object: post-images/${postKey}.jpg`, err);
          return `Failed to retrieve object from S3 for post ${postKey}`;
        }
      });
      return Promise.all(urlPromises);
    } catch (error) {
      console.error("Failed to get batch posts:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error retrieving batch posts.' });
    }
  }
};

export default PostService;

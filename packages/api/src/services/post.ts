// src/service/PostService.ts
import { TRPCError } from "@trpc/server";

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
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error creating post.",
      });
    }
  },

  editPost: async (postId: number, newCaption: string) => {
    try {
      return await Repositories.post.updatePost(postId, newCaption);
    } catch (error) {
      console.error("Failed to edit post:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error editing post.",
      });
    }
  },

  getPost: async (postId: number) => {
    try {
      const post = await Repositories.post.getPost(postId);
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Post with key ${postId} not found.`,
        });
      }
      return post;
    } catch (error) {
      console.error("Failed to retrieve post:", error);
      throw error; // Re-throw the same error or a new one if needed
    }
  },

  usersPosts: async (userId: string) => {
    try {
      return await Repositories.post.getAllUserPosts(userId);
    } catch (error) {
      console.error("Failed to retrieve user posts:", error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error retrieving user posts.' });
    }
  },

  deletePost: async (postId: number) => {
    try {
      await Repositories.post.deletePost(postId);
      return;
    } catch (error) {
      console.error("Failed to delete post:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error deleting post.",
      });
    }
  },

  getBatchPosts: async (postIds: number[]) => {
    const bucket = process.env.S3_BUCKET_NAME!;
    try {
      const urlPromises = postIds.map(async (postId) => {
        try {
          const post = await Repositories.post.getPost(postId);
          if (!post) {
            throw new Error(`Post with key ${postId} not found`);
          }
          return await Services.aws.objectPresignedUrl(
            bucket,
            `post-images/${post.key}.jpg`,
          );
        } catch (err) {
          console.error(
            `Error retrieving post: post-images/${postId}.jpg`,
            err,
          );
          return `Failed to retrieve object from S3 for post ${postId}`;
        }
      });
      return Promise.all(urlPromises);
    } catch (error) {
      console.error("Failed to get batch posts:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error retrieving batch posts.",
      });
    }
  },
};

export default PostService;

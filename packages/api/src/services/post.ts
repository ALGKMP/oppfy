// src/service/PostService.ts
import Services from ".";
import repositories from "../repositories";

const PostService = {
  createPost: async (
    postedBy: string,
    postedFor: string,
    caption: string,
    objectKey: string,
  ) => {
    try {
      const postId = await repositories.post.createPost(
        postedBy,
        postedFor,
        caption,
        objectKey,
      );
      if (!postId) {
        throw new Error("Failed to create post.");
      }
      return await repositories.postStats.createPostStats(postId);
    } catch (error) {
      console.error("Failed to create post:", error);
      throw new Error("Error creating post.");
    }
  },

  editPost: async (postId: number, newCaption: string) => {
    try {
      return await repositories.post.updatePost(postId, newCaption);
    } catch (error) {
      console.error("Failed to edit post:", error);
      throw new Error("Error editing post.");
    }
  },

  getPost: async (postId: number) => {
    try {
      const post = await repositories.post.getPost(postId);
      if (!post) {
        throw new Error(`Post with key ${postId} not found.`);
      }
      return post;
    } catch (error) {
      console.error("Failed to retrieve post:", error);
      throw error; // Re-throw the same error or a new one if needed
    }
  },

  getUserPosts : async (userId: string) => {
    const bucket = process.env.S3_BUCKET_NAME!;
    try {
      const posts = await repositories.post.allUserPosts(userId);
  
      if (posts.length === 0) {
        console.log("No posts");
        return [];
      }
  
      // Create an array of promises that resolve to {id, url} objects
      const results = await Promise.all(posts.map(async (post) => {
        const authorsUsername = await Services.user.getUsername(post.author);
        const friendsUsername = await Services.user.getUsername(post.recipient);
        try {
          const url = await Services.aws.objectPresignedUrl(bucket, post.key);
          return {
            id: post.id,
            authorsUsername,
            authorId: post.author,
            friendsUsername,
            friendId: post.recipient,
            url,
            caption: post.caption,
          };
        } catch (err) {
          console.error(`Error retrieving post: posts/${post.id}.jpg`, err);
          return {
            id: post.id,
            authorsUsername,
            authorId: post.author,
            friendsUsername,
            friendId: post.recipient,
            url: null,
            caption: post.caption,
          }; // Return null for URL on error
        }
      }));
  
      return results;
    } catch (error) {
      console.error("Failed to get posts:", error);
      throw new Error("Error retrieving all of Users posts.");
    }
  },
  
  deletePost: async (postId: number) => {
    try {
      await repositories.post.deletePost(postId);
      return;
    } catch (error) {
      console.error("Failed to delete post:", error);
      throw new Error("Error deleting post.");
    }
  },

  getPostsBatch: async (
    postIds: number[],
  ): Promise<Record<number, string | null>> => {
    const bucket = process.env.S3_BUCKET_NAME!;
    try {
      const results: Record<number, string | null> = {};
      const urlPromises = postIds.map(async (postId) => {
        try {
          const post = await repositories.post.getPost(postId);
          if (!post) {
            throw new Error(`Post with key ${postId} not found`);
          }
          const url = await Services.aws.objectPresignedUrl(
            bucket,
            `post/${post.key}.jpg`,
          );
          results[postId] = url; // Store URL with postId as key
        } catch (err) {
          console.error(`Error retrieving post: post/${postId}.jpg`, err);
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

import type { Post } from "./post-repository.interface";

export interface IPostService {
  uploadPicturePostForUserOnApp(params: {
    author: string;
    recipient: string;
    caption: string;
    height: string;
    width: string;
    contentLength: number;
    contentType: string;
  }): Promise<Post>;

  likePost(params: { userId: string; postId: string }): Promise<void>;
  unlikePost(params: { userId: string; postId: string }): Promise<void>;
  
  getPostById(postId: string): Promise<Post>;
  deletePost(params: { userId: string; postId: string }): Promise<void>;
  
  // Add other methods as needed
} 
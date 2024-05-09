import { DomainError, ErrorCode } from "../errors";
import { PostRepository } from "../repositories/post";
import { PostStatsRepository } from "../repositories/postStats";
import { UserRepository } from "../repositories/user";
import { AwsService } from "./aws";

interface PaginatedResponse<T> {
  items: T[];
  nextCursor: Cursor | undefined;
}

interface Cursor {
  createdAt: Date;
  postId: number;
  pageSize?: number;
}

interface Post {
  postId: number;
  authorId: string;
  authorUsername: string | null;
  authorProfilePicture: string;
  recipientId: string;
  recipientUsername: string | null;
  recipientProfilePicture: string;
  imageUrl: string;
  caption: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
}

export class PostService {
  private awsService = new AwsService();
  private userRepository = new UserRepository();
  private postRepository = new PostRepository();
  private postStatsRepository = new PostStatsRepository();

  private async _updateProfilePictureUrls(
    data: Post[],
    pageSize = 20,
  ): Promise<PaginatedResponse<Post>> {
    const items = await Promise.all(
      data.map(async (item) => {
        // Update author profile picture URL
        const authorPresignedUrl = await this.awsService.getObjectPresignedUrl({
          Bucket: process.env.S3_PROFILE_BUCKET!,
          Key: item.authorProfilePicture ?? "profile-pictures/default.jpg",
        });
        item.authorProfilePicture = authorPresignedUrl;

        // Update recipient profile picture URL
        const recipientPresignedUrl =
          await this.awsService.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: item.recipientProfilePicture ?? "profile-pictures/default.jpg",
          });
        item.recipientProfilePicture = recipientPresignedUrl;

        const imageUrl = await this.awsService.getObjectPresignedUrl({
          Bucket: process.env.S3_POST_BUCKET!,
          Key: item.imageUrl,
        });
        item.imageUrl = imageUrl;
        return item;
      }),
    );

    let nextCursor: Cursor | undefined = undefined;
    if (items.length > pageSize) {
      const nextItem = items.pop();
      nextCursor = {
        createdAt: nextItem!.createdAt,
        postId: nextItem!.postId,
      };
      console.log("server: ", nextCursor);
    }
    return {
      items,
      nextCursor,
    };
  }

  async getPosts(userId: string, cursor: Cursor | null = null, pageSize?: number): Promise<PaginatedResponse<Post>> {
    const data = await this.postRepository.getPaginatedPosts(userId, cursor);

    return this._updateProfilePictureUrls(data, pageSize);
  }

  async createPost(
    postedBy: string,
    postedFor: string,
    caption: string,
    objectKey: string,
  ) {
    const result = await this.postRepository.createPost(
      postedBy,
      postedFor,
      caption,
      objectKey,
    );

    const postId = result[0].insertId;
    await this.postStatsRepository.createPostStats(postId);
  }

  async editPost(postId: number, newCaption: string) {
    await this.postRepository.updatePost(postId, newCaption);
  }

  async getPost(postId: number) {
    const post = await this.postRepository.getPost(postId);

    if (post === undefined) {
      throw new DomainError(ErrorCode.POST_NOT_FOUND);
    }

    return post;
  }

  async deletePost(postId: number) {
    await this.postRepository.deletePost(postId);
  }
}

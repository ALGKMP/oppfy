import { DomainError, ErrorCode } from "../errors";
import { AwsRepository } from "../repositories/aws";
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
}

interface Post {
  postId: number;
  authorId: string;
  recipientId: string;
  caption: string | null;
  imageUrl: string;
  createdAt: Date;
  // profileId
}

export class PostService {
  private awsService = new AwsService();
  private userRepository = new UserRepository();
  private postRepository = new PostRepository();
  private postStatsRepository = new PostStatsRepository();

  private async _updateProfilePictureUrls(
    data: UserProfile[],
    pageSize: number,
  ): Promise<PaginatedResponse<UserProfile>> {
    const items = await Promise.all(
      data.map(async (item) => {
        if (item.profilePictureUrl) {
          const presignedUrl = await this.awsService.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: item.profilePictureUrl,
          });
          item.profilePictureUrl = presignedUrl;
        } else {
          const presignedUrl = await this.awsService.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: "profile-pictures/default.jpg",
          });
          item.profilePictureUrl = presignedUrl;
        }
        return item;
      }),
    );

    let nextCursor: Cursor | undefined = undefined;
    if (items.length > pageSize) {
      const nextItem = items.pop();
      nextCursor = {
        createdAt: nextItem!.createdAt,
        profileId: nextItem!.profileId,
      };
      console.log("server: ", nextCursor);
    }
    return {
      items,
      nextCursor,
    };
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

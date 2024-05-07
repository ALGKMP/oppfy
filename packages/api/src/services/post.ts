import { DomainError, ErrorCode } from "../errors";
import { AwsRepository } from "../repositories/aws";
import { PostRepository } from "../repositories/post";
import { PostStatsRepository } from "../repositories/postStats";
import { UserRepository } from "../repositories/user";

export class PostService {
  private awsRepository = new AwsRepository();
  private userRepository = new UserRepository();
  private postRepository = new PostRepository();
  private postStatsRepository = new PostStatsRepository();

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

  async getUserPosts(userId: string) {
    const bucket = process.env.S3_POST_BUCKET!;

    const posts = await this.postRepository.getAllPosts(userId);

    const results = await Promise.all(
      posts.map(async (post) => {
        const author = await this.userRepository.getUser(post.author);
        const recipient = await this.userRepository.getUser(post.recipient);

        if (!author || !recipient) {
          throw new DomainError(ErrorCode.USER_NOT_FOUND);
        }

        const presignedUrl = await this.awsRepository.getObjectPresignedUrl({
          Key: post.key,
          Bucket: bucket,
        });

        return {
          id: post.id,
          authorsId: author.id,
          authorsUsername: author.username,
          recipientsId: recipient.id,
          recipientsUsername: recipient.username,
          caption: post.caption,
          presignedUrl,
        };
      }),
    );

    return results;
  }

  async deletePost(postId: number) {
    await this.postRepository.deletePost(postId);
  }
}

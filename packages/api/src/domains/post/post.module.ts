import { PostLikeRepository } from "./repositories/post-like.repository";
import { PostStatsRepository } from "./repositories/post-stats.repository";
import { PostRepository } from "./repositories/post.repository";
import { PostService } from "./services/post.service";

export class PostModule {
  private static _postService: PostService;

  static get postService(): PostService {
    if (!this._postService) {
      const postRepository = new PostRepository();
      const postStatsRepository = new PostStatsRepository();
      const postLikeRepository = new PostLikeRepository();

      this._postService = new PostService(
        postRepository,
        postStatsRepository,
        postLikeRepository,
      );
    }

    return this._postService;
  }
}

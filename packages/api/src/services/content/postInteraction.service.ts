import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import * as PostInteractionErrors from "../../errors/content/postInteraction.error";
import type { ICommentRepository } from "../../interfaces/repositories/content/comment.repository.interface";
import type { ILikeRepository } from "../../interfaces/repositories/content/like.repository.interface";
import type { IPostRepository } from "../../interfaces/repositories/content/post.repository.interface";
import type {
  AddCommentParams,
  IPostInteractionService,
  LikePostParams,
  RemoveCommentParams,
  UnlikePostParams,
} from "../../interfaces/services/content/postInteraction.service.interface";

@injectable()
export class PostInteractionService implements IPostInteractionService {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.PostRepository)
    private readonly postRepository: IPostRepository,
    @inject(TYPES.CommentRepository)
    private readonly commentRepository: ICommentRepository,
    @inject(TYPES.LikeRepository)
    private readonly likeRepository: ILikeRepository,
  ) {}

  async likePost({
    postId,
    userId,
  }: LikePostParams): Promise<
    Result<
      void,
      | PostInteractionErrors.PostNotFound
      | PostInteractionErrors.FailedToLikePost
      | PostInteractionErrors.AlreadyLiked
    >
  > {
    await this.db.transaction(async (tx) => {
      const post = await this.postRepository.getPost({ postId, userId }, tx);
      if (!post) throw new PostInteractionErrors.PostNotFound(postId);

      const existingLike = await this.likeRepository.getLike(
        { postId, userId },
        tx,
      );
      if (existingLike)
        return err(new PostInteractionErrors.AlreadyLiked(postId, userId));

      await this.likeRepository.createLike({ postId, userId }, tx);
    });
    return ok();
  }

  async unlikePost({
    postId,
    userId,
  }: UnlikePostParams): Promise<
    Result<
      void,
      | PostInteractionErrors.PostNotFound
      | PostInteractionErrors.FailedToUnlikePost
      | PostInteractionErrors.NotLiked
    >
  > {
    await this.db.transaction(async (tx) => {
      const post = await this.postRepository.getPost({ postId, userId }, tx);
      if (!post) return err(new PostInteractionErrors.PostNotFound(postId));

      const existingLike = await this.likeRepository.getLike(
        { postId, userId },
        tx,
      );
      if (!existingLike)
        return err(new PostInteractionErrors.NotLiked(postId, userId));

      await this.likeRepository.deleteLike({ postId, userId }, tx);
    });
    return ok();
  }

  async addComment({
    postId,
    userId,
    body,
  }: AddCommentParams): Promise<
    Result<
      void,
      PostInteractionErrors.PostNotFound | PostInteractionErrors.FailedToComment
    >
  > {
    await this.db.transaction(async (tx) => {
      const post = await this.postRepository.getPost({ postId, userId }, tx);
      if (!post) return err(new PostInteractionErrors.PostNotFound(postId));

      await this.commentRepository.createComment({ postId, userId, body }, tx);
    });
    return ok();
  }

  async removeComment({
    commentId,
    postId,
    userId,
  }: RemoveCommentParams): Promise<
    Result<
      void,
      | PostInteractionErrors.CommentNotFound
      | PostInteractionErrors.NotCommentOwner
      | PostInteractionErrors.FailedToDeleteComment
    >
  > {
    await this.db.transaction(async (tx) => {
      const comment = await this.commentRepository.getComment(
        { commentId },
        tx,
      );
      if (!comment)
        return err(new PostInteractionErrors.CommentNotFound(commentId));
      if (comment.userId !== userId)
        return err(
          new PostInteractionErrors.NotCommentOwner(commentId, userId),
        );

      await this.commentRepository.deleteComment({ commentId, postId }, tx);
    });
    return ok();
  }
}

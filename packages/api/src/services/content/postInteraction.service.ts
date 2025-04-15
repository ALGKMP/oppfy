import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import * as PostInteractionErrors from "../../errors/content/postInteraction.error";
import { CommentRepository } from "../../repositories/content/comment.repository";
import { LikeRepository } from "../../repositories/content/like.repository";
import { PostRepository } from "../../repositories/content/post.repository";
import { TYPES } from "../../symbols";

interface LikePostParams {
  postId: string;
  userId: string;
}

interface UnlikePostParams {
  postId: string;
  userId: string;
}

interface AddCommentParams {
  postId: string;
  userId: string;
  body: string;
}

interface RemoveCommentParams {
  commentId: string;
  postId: string;
  userId: string;
}

@injectable()
export class PostInteractionService {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.PostRepository)
    private readonly postRepository: PostRepository,
    @inject(TYPES.CommentRepository)
    private readonly commentRepository: CommentRepository,
    @inject(TYPES.LikeRepository)
    private readonly likeRepository: LikeRepository,
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

  async hasLiked({
    postId,
    userId,
  }: LikePostParams): Promise<
    Result<
      boolean,
      PostInteractionErrors.PostNotFound | PostInteractionErrors.NotLiked
    >
  > {
    const existingLike = await this.likeRepository.getLike({ postId, userId });
    return ok(existingLike !== null);
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

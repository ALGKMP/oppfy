import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";
import { SQS } from "@oppfy/sqs";

import * as PostInteractionErrors from "../../errors/content/postInteraction.error";
import * as ProfileErrors from "../../errors/user/profile.error";
import { CommentRepository } from "../../repositories/content/comment.repository";
import { LikeRepository } from "../../repositories/content/like.repository";
import { PostRepository } from "../../repositories/content/post.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
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
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TYPES.SQS) private readonly sqs: SQS,
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
      | ProfileErrors.ProfileNotFound
    >
  > {
    const recipientId = await this.db.transaction(async (tx) => {
      const post = await this.postRepository.getPost({ postId, userId }, tx);
      if (!post) throw new PostInteractionErrors.PostNotFound(postId);

      const existingLike = await this.likeRepository.getLike(
        { postId, userId },
        tx,
      );
      if (existingLike)
        return err(new PostInteractionErrors.AlreadyLiked(postId, userId));

      await this.likeRepository.createLike({ postId, userId }, tx);

      return ok(post.post.recipientUserId);
    });

    if (recipientId.isErr()) return err(recipientId.error);

    // get username
    const profile = await this.profileRepository.getProfile({
      userId: recipientId.value,
    });

    if (!profile) throw new ProfileErrors.ProfileNotFound(recipientId.value);

    await this.sqs.sendLikeNotification({
      postId,
      senderId: userId,
      recipientId: recipientId.value,
      username: profile.username,
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
    userId,
    postId,
    body,
  }: AddCommentParams): Promise<
    Result<
      void,
      PostInteractionErrors.PostNotFound | PostInteractionErrors.FailedToComment
    >
  > {
    const post = await this.db.transaction(async (tx) => {
      const post = await this.postRepository.getPost({ postId, userId }, tx);
      if (!post) return err(new PostInteractionErrors.PostNotFound(postId));

      await this.commentRepository.createComment({ postId, userId, body }, tx);

      return ok(post);
    });

    if (post.isErr()) return err(post.error);

    // get username
    const profile = await this.profileRepository.getProfile({ userId });
    if (!profile) throw new ProfileErrors.ProfileNotFound(userId);

    await this.sqs.sendCommentNotification({
      postId,
      senderId: userId,
      recipientId: post.value.post.recipientUserId,
      username: profile.username,
    });

    return ok();
  }

  async removeComment({
    userId,
    postId,
    commentId,
  }: RemoveCommentParams): Promise<
    Result<
      void,
      | PostInteractionErrors.PostNotFound
      | PostInteractionErrors.CommentNotFound
      | PostInteractionErrors.NotCommentOwner
      | PostInteractionErrors.NotPostOwner
    >
  > {
    return await this.db.transaction(async (tx) => {
      const post = await this.postRepository.getPost({ postId, userId }, tx);
      const comment = await this.commentRepository.getComment(
        { commentId },
        tx,
      );

      if (post === undefined)
        return err(new PostInteractionErrors.PostNotFound(postId));
      if (comment === undefined)
        return err(new PostInteractionErrors.CommentNotFound(commentId));

      // if not comment owner or post owner
      if (comment.userId !== userId && post.post.recipientUserId !== userId) {
        if (comment.userId !== userId)
          return err(
            new PostInteractionErrors.NotCommentOwner(commentId, userId),
          );

        if (post.post.authorUserId !== userId)
          return err(new PostInteractionErrors.NotPostOwner(postId, userId));
      }

      await this.commentRepository.deleteComment({ commentId, postId }, tx);

      return ok();
    });
  }
}

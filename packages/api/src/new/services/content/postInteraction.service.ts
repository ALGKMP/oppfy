import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { PostInteractionErrors } from "../../errors/content/postInteraction.error";
import type { ICommentRepository } from "../../interfaces/repositories/content/commentRepository.interface";
import type { ILikeRepository } from "../../interfaces/repositories/content/likeRepository.interface";
import type { IPostRepository } from "../../interfaces/repositories/content/postRepository.interface";
import type { IPostStatsRepository } from "../../interfaces/repositories/content/postStatsRepository.interface";
import type { IRelationshipRepository } from "../../interfaces/repositories/social/relationshipRepository.interface";
import type { INotificationsRepository } from "../../interfaces/repositories/user/notificationRepository.interface";
import type { IProfileStatsRepository } from "../../interfaces/repositories/user/profileStatsRepository.interface";
import type {
  CommentCursor,
  CommentOnPostParams,
  DeleteCommentParams,
  GetLikeParams,
  IPostInteractionService,
  LikePostParams,
  PaginateCommentsParams,
  PaginatedResponse,
  UnlikePostParams,
} from "../../interfaces/services/content/postInteractionService.interface";
import type { PaginatedComment } from "../../interfaces/repositories/content/commentRepository.interface";

@injectable()
export class PostInteractionService implements IPostInteractionService {
  constructor(
    @inject(TYPES.Database)
    private db: Database,
    @inject(TYPES.PostRepository)
    private postRepository: IPostRepository,
    @inject(TYPES.LikeRepository)
    private likeRepository: ILikeRepository,
    @inject(TYPES.CommentRepository)
    private commentRepository: ICommentRepository,
    @inject(TYPES.PostStatsRepository)
    private postStatsRepository: IPostStatsRepository,
    @inject(TYPES.NotificationsRepository)
    private notificationsRepository: INotificationsRepository,
    @inject(TYPES.ProfileStatsRepository)
    private profileStatsRepository: IProfileStatsRepository,
    @inject(TYPES.RelationshipRepository)
    private relationshipRepository: IRelationshipRepository,
  ) {}

  async likePost(
    params: LikePostParams,
  ): Promise<
    Result<
      void,
      | PostInteractionErrors.FailedToLikePost
      | PostInteractionErrors.AlreadyLiked
      | PostInteractionErrors.PostNotFound
    >
  > {
    const { userId, postId } = params;

    // Check if post exists
    const post = await this.postRepository.getPost({ postId, userId });
    if (!post) {
      return err(new PostInteractionErrors.PostNotFound(postId));
    }

    // Check if already liked
    const existingLike = await this.likeRepository.findLike({
      userId,
      postId,
    });

    if (existingLike) {
      return err(new PostInteractionErrors.AlreadyLiked(postId, userId));
    }

    await this.db.transaction(async (tx) => {
      // Create like
      await this.likeRepository.addLike(
        {
          userId,
          postId,
        },
        tx,
      );

      // Update post stats
      await this.postStatsRepository.incrementLikesCount(
        {
          postId,
        },
        tx,
      );
    });

    return ok(undefined);
  }

  async unlikePost(
    params: UnlikePostParams,
  ): Promise<
    Result<
      void,
      | PostInteractionErrors.FailedToUnlikePost
      | PostInteractionErrors.NotLiked
      | PostInteractionErrors.PostNotFound
    >
  > {
    const { userId, postId } = params;

    // Check if post exists
    const post = await this.postRepository.getPost({ postId, userId });
    if (!post) {
      return err(new PostInteractionErrors.PostNotFound(postId));
    }

    // Check if liked
    const existingLike = await this.likeRepository.findLike({
      userId,
      postId,
    });

    if (!existingLike) {
      return err(new PostInteractionErrors.NotLiked(postId, userId));
    }

    await this.db.transaction(async (tx) => {
      // Delete like
      await this.likeRepository.removeLike(
        {
          userId,
          postId,
        },
        tx,
      );

      // Update post stats
      await this.postStatsRepository.decrementLikesCount(
        {
          postId,
        },
        tx,
      );
    });

    return ok(undefined);
  }

  async getLike(
    params: GetLikeParams,
  ): Promise<Result<boolean, PostInteractionErrors.PostNotFound>> {
    const { userId, postId } = params;

    // Check if post exists
    const post = await this.postRepository.getPost({ postId, userId });
    if (!post) {
      return err(new PostInteractionErrors.PostNotFound(postId));
    }

    const like = await this.likeRepository.findLike({
      userId,
      postId,
    });

    return ok(!!like);
  }

  async commentOnPost(
    params: CommentOnPostParams,
  ): Promise<
    Result<
      void,
      PostInteractionErrors.FailedToComment | PostInteractionErrors.PostNotFound
    >
  > {
    const { userId, postId, body } = params;

    // Check if post exists
    const post = await this.postRepository.getPost({ postId, userId });
    if (!post) {
      return err(new PostInteractionErrors.PostNotFound(postId));
    }

    await this.db.transaction(async (tx) => {
      // Create comment
      await this.commentRepository.addComment(
        {
          userId,
          postId,
          body,
        },
        tx,
      );

      // Update post stats
      await this.postStatsRepository.incrementCommentsCount(
        {
          postId,
        },
        tx,
      );

      // Update user stats
      await this.profileStatsRepository.incrementCommentsCount(
        {
          userId: post.recipientId,
        },
        tx,
      );
    });

    return ok(undefined);
  }

  async deleteComment(
    params: DeleteCommentParams,
  ): Promise<
    Result<
      void,
      | PostInteractionErrors.FailedToDeleteComment
      | PostInteractionErrors.CommentNotFound
      | PostInteractionErrors.NotCommentOwner
    >
  > {
    const { userId, commentId, postId } = params;

    // Check if comment exists
    const comment = await this.commentRepository.getComment({
      commentId,
    });
    if (!comment) {
      return err(new PostInteractionErrors.CommentNotFound(commentId));
    }

    // Check if user owns the comment
    if (comment.userId !== userId) {
      return err(new PostInteractionErrors.NotCommentOwner(commentId, userId));
    }

    await this.db.transaction(async (tx) => {
      // Delete comment
      await this.commentRepository.removeComment(
        {
          commentId,
        },
        tx,
      );

      // Update post stats
      await this.postStatsRepository.decrementCommentsCount(
        {
          postId,
        },
        tx,
      );
    });

    return ok(undefined);
  }

  async paginateComments(
    params: PaginateCommentsParams,
  ): Promise<
    Result<
      PaginatedResponse<PaginatedComment, CommentCursor>,
      PostInteractionErrors.PostNotFound
    >
  > {
    const { postId, cursor, pageSize = 20, userId } = params;

    // Check if post exists
    const post = await this.postRepository.getPost({ postId, userId });
    if (!post) {
      return err(new PostInteractionErrors.PostNotFound(postId));
    }

    const comments = await this.commentRepository.paginateComments({
      postId,
      cursor,
      pageSize,
    });

    return ok({
      items: comments,
      nextCursor:
        comments.length === pageSize
          ? {
              commentId: comments[comments.length - 1]!.commentId,
              createdAt: comments[comments.length - 1]!.createdAt,
            }
          : null,
    });
  }
}

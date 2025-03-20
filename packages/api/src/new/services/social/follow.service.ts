import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { FollowErrors } from "../../errors/social/follow.error";
import { UserErrors } from "../../errors/user/user.error";
import type { IFollowRepository } from "../../interfaces/repositories/social/followRepository.interface";
import type { IRelationshipRepository } from "../../interfaces/repositories/social/relationshipRepository.interface";
import type { INotificationsRepository } from "../../interfaces/repositories/user/notificationRepository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/userRepository.interface";
import type { IFollowService } from "../../interfaces/services/social/followService.interface";

@injectable()
export class FollowService implements IFollowService {
  constructor(
    @inject(TYPES.Database) private db: Database,
    @inject(TYPES.FollowRepository) private followRepository: IFollowRepository,
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.NotificationsRepository)
    private notificationsRepository: INotificationsRepository,
    @inject(TYPES.RelationshipRepository)
    private relationshipRepository: IRelationshipRepository,
  ) {}

  async isFollowing(options: {
    followerId: string;
    followeeId: string;
  }): Promise<Result<boolean, never>> {
    const { followerId, followeeId } = options;
    const follower = await this.followRepository.getFollower({
      followerId,
      followeeId,
    });
    return ok(!!follower);
  }

  async sendFollowRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      | FollowErrors.AlreadyFollowing
      | FollowErrors.RequestAlreadySent
      | FollowErrors.CannotFollowSelf
      | FollowErrors.FailedToSendRequest
      | UserErrors.UserNotFound
    >
  > {
    const { senderId, recipientId } = options;

    if (senderId === recipientId) {
      return err(new FollowErrors.CannotFollowSelf(senderId));
    }

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      this.userRepository.getUserWithProfile({ userId: senderId }),
      this.userRepository.getUserWithProfile({ userId: recipientId }),
    ]);

    if (!sender || !recipient) {
      return err(new UserErrors.UserNotFound(!sender ? senderId : recipientId));
    }

    const relationship = await this.relationshipRepository.getByUserIds({
      userIdA: senderId,
      userIdB: recipientId,
    });

    if (relationship.followStatus === "following") {
      return err(new FollowErrors.AlreadyFollowing(senderId, recipientId));
    } else if (relationship.followStatus === "outboundRequest") {
      return err(new FollowErrors.RequestAlreadySent(senderId, recipientId));
    }

    await this.db.transaction(async (tx) => {
      // Create follow request
      await this.followRepository.createFollowRequest(
        {
          senderId,
          recipientId,
        },
        tx,
      );

      // Get notification settings
      const notificationSettings =
        await this.notificationsRepository.getNotificationSettings({
          notificationSettingsId: recipient.notificationSettingsId,
        });

      if (notificationSettings?.followRequests) {
        await this.notificationsRepository.storeNotification(
          {
            senderId,
            recipientId,
            notificationData: {
              eventType: "follow",
              entityType: "profile",
              entityId: senderId,
            },
          },
          tx,
        );
      }
    });

    return ok(undefined);
  }

  async acceptFollowRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      FollowErrors.RequestNotFound | FollowErrors.FailedToAcceptRequest
    >
  > {
    const { senderId, recipientId } = options;

    // Check if follow request exists
    const existingRequest = await this.followRepository.getFollowRequest({
      senderId,
      recipientId,
    });

    if (!existingRequest) {
      return err(new FollowErrors.RequestNotFound(senderId, recipientId));
    }

    await this.db.transaction(async (tx) => {
      // Delete follow request and create follower
      await this.followRepository.deleteFollowRequest(
        {
          senderId,
          recipientId,
        },
        tx,
      );
      await this.followRepository.createFollower(
        {
          senderUserId: senderId,
          recipientUserId: recipientId,
        },
        tx,
      );

      // Get notification settings
      const sender = await this.userRepository.getUser({ userId: senderId });
      if (!sender) {
        return err(
          new FollowErrors.FailedToAcceptRequest(senderId, recipientId),
        );
      }

      const notificationSettings =
        await this.notificationsRepository.getNotificationSettings({
          notificationSettingsId: sender.notificationSettingsId,
        });

      if (notificationSettings?.followRequests) {
        await this.notificationsRepository.storeNotification(
          {
            senderId: recipientId,
            recipientId: senderId,
            notificationData: {
              eventType: "follow",
              entityType: "profile",
              entityId: recipientId,
            },
          },
          tx,
        );
      }
    });

    return ok(undefined);
  }

  async declineFollowRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      FollowErrors.RequestNotFound | FollowErrors.FailedToDeclineRequest
    >
  > {
    const { senderId, recipientId } = options;

    // Check if follow request exists
    const existingRequest = await this.followRepository.getFollowRequest({
      senderId,
      recipientId,
    });

    if (!existingRequest) {
      return err(new FollowErrors.RequestNotFound(senderId, recipientId));
    }

    await this.db.transaction(async (tx) => {
      // Delete follow request
      await this.followRepository.deleteFollowRequest(
        {
          senderId,
          recipientId,
        },
        tx,
      );
    });

    return ok(undefined);
  }

  async removeFollow(options: {
    followerId: string;
    followeeId: string;
  }): Promise<
    Result<void, FollowErrors.NotFollowing | FollowErrors.FailedToRemove>
  > {
    const { followerId, followeeId } = options;

    // Check if following
    const existingFollow = await this.followRepository.getFollower({
      followerId,
      followeeId,
    });

    if (!existingFollow) {
      return err(new FollowErrors.NotFollowing(followerId, followeeId));
    }

    await this.db.transaction(async (tx) => {
      // Remove follower
      await this.followRepository.removeFollower(
        {
          followerId,
          followeeId,
        },
        tx,
      );
    });

    return ok(undefined);
  }

  async getFollowRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      { senderId: string; recipientId: string; createdAt: Date } | undefined,
      never
    >
  > {
    const { senderId, recipientId } = options;
    const request = await this.followRepository.getFollowRequest({
      senderId,
      recipientId,
    });
    return ok(
      request ? { senderId, recipientId, createdAt: new Date() } : undefined,
    );
  }

  async countFollowers(options: {
    userId: string;
  }): Promise<Result<number, FollowErrors.FailedToCountFollowers>> {
    const { userId } = options;
    const count = await this.followRepository.countFollowers({ userId });
    return ok(count ?? 0);
  }

  async countFollowing(options: {
    userId: string;
  }): Promise<Result<number, FollowErrors.FailedToCountFollowing>> {
    const { userId } = options;
    const count = await this.followRepository.countFollowing({ userId });
    return ok(count ?? 0);
  }

  async countFollowRequests(options: {
    userId: string;
  }): Promise<Result<number, FollowErrors.FailedToCountRequests>> {
    const { userId } = options;
    const count = await this.followRepository.countFollowRequests({ userId });
    return ok(count ?? 0);
  }

  async getFollowers(options: {
    userId: string;
    limit?: number;
    cursor?: string;
  }): Promise<
    Result<
      { items: { id: string; username: string }[]; nextCursor?: string },
      never
    >
  > {
    const { userId, limit, cursor } = options;
    const followers = await this.followRepository.paginateFollowersSelf({
      forUserId: userId,
      pageSize: limit,
      cursor: cursor
        ? { createdAt: new Date(cursor), profileId: cursor }
        : null,
    });
    return ok({
      items: followers.map((follower) => ({
        id: follower.userId,
        username: follower.username,
      })),
      nextCursor:
        followers.length === limit && followers[followers.length - 1]?.profileId
          ? followers[followers.length - 1]!.profileId
          : undefined,
    });
  }

  async getFollowing(options: {
    userId: string;
    limit?: number;
    cursor?: string;
  }): Promise<
    Result<
      { items: { id: string; username: string }[]; nextCursor?: string },
      never
    >
  > {
    const { userId, limit, cursor } = options;
    const following = await this.followRepository.paginateFollowingSelf({
      userId,
      pageSize: limit,
      cursor: cursor
        ? { createdAt: new Date(cursor), profileId: cursor }
        : null,
    });
    return ok({
      items: following.map((followee) => ({
        id: followee.userId,
        username: followee.username,
      })),
      nextCursor:
        following.length === limit && following[following.length - 1]?.profileId
          ? following[following.length - 1]!.profileId
          : undefined,
    });
  }

  async getFollowRequests(options: {
    userId: string;
    limit?: number;
    cursor?: string;
  }): Promise<
    Result<
      {
        items: { id: string; username: string; createdAt: Date }[];
        nextCursor?: string;
      },
      never
    >
  > {
    const { userId, limit, cursor } = options;
    const requests = await this.followRepository.paginateFollowRequests({
      forUserId: userId,
      pageSize: limit,
      cursor: cursor
        ? { createdAt: new Date(cursor), profileId: cursor }
        : null,
    });
    return ok({
      items: requests.map((request) => ({
        id: request.userId,
        username: request.username,
        createdAt: request.createdAt,
      })),
      nextCursor:
        requests.length === limit && requests[requests.length - 1]?.profileId
          ? requests[requests.length - 1]!.profileId
          : undefined,
    });
  }

  async getFollowStatus(options: {
    userId: string;
    targetUserId: string;
  }): Promise<Result<"following" | "requested" | "notFollowing", never>> {
    const { userId, targetUserId } = options;

    // Check if following
    const isFollowing = await this.followRepository.getFollower({
      followerId: userId,
      followeeId: targetUserId,
    });

    if (isFollowing) {
      return ok("following");
    }

    // Check if there's a pending follow request
    const followRequest = await this.followRepository.getFollowRequest({
      senderId: userId,
      recipientId: targetUserId,
    });

    if (followRequest) {
      return ok("requested");
    }

    return ok("notFollowing");
  }

  async removeFollower(options: {
    userId: string;
    followerToRemove: string;
  }): Promise<
    Result<void, FollowErrors.NotFollowing | FollowErrors.FailedToRemove>
  > {
    const { userId, followerToRemove } = options;

    // Check if following
    const existingFollow = await this.followRepository.getFollower({
      followerId: followerToRemove,
      followeeId: userId,
    });

    if (!existingFollow) {
      return err(new FollowErrors.NotFollowing(followerToRemove, userId));
    }

    await this.db.transaction(async (tx) => {
      // Remove follower
      await this.followRepository.removeFollower(
        {
          followerId: followerToRemove,
          followeeId: userId,
        },
        tx,
      );
    });

    return ok(undefined);
  }

  async cancelFollowRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      FollowErrors.RequestNotFound | FollowErrors.FailedToDeclineRequest
    >
  > {
    const { senderId, recipientId } = options;

    // Check if follow request exists
    const existingRequest = await this.followRepository.getFollowRequest({
      senderId,
      recipientId,
    });

    if (!existingRequest) {
      return err(new FollowErrors.RequestNotFound(senderId, recipientId));
    }

    await this.db.transaction(async (tx) => {
      // Delete follow request
      await this.followRepository.deleteFollowRequest(
        {
          senderId,
          recipientId,
        },
        tx,
      );
    });

    return ok(undefined);
  }
}

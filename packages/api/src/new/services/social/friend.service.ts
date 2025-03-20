import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database, FriendStatus } from "@oppfy/db";

import { TYPES } from "../../container";
import { FriendErrors } from "../../errors/social/friend.error";
import { ProfileErrors } from "../../errors/user/profile.error";
import type { IFollowRepository } from "../../interfaces/repositories/social/followRepository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friendRepository.interface";
import type { IRelationshipRepository } from "../../interfaces/repositories/social/relationshipRepository.interface";
import type { INotificationsRepository } from "../../interfaces/repositories/user/notificationRepository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/userRepository.interface";
import type { IFriendService } from "../../interfaces/services/social/friendService.interface";

@injectable()
export class FriendService implements IFriendService {
  constructor(
    @inject(TYPES.Database) private db: Database,
    @inject(TYPES.FriendRepository) private friendRepository: IFriendRepository,
    @inject(TYPES.FollowRepository) private followRepository: IFollowRepository,
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.NotificationsRepository)
    private notificationsRepository: INotificationsRepository,
    @inject(TYPES.RelationshipRepository)
    private relationshipRepository: IRelationshipRepository,
  ) {}

  async isFollowing(options: {
    senderId: string;
    recipientId: string;
  }): Promise<Result<boolean, never>> {
    const { senderId, recipientId } = options;
    const follower = await this.followRepository.getFollower({
      followerId: senderId,
      followeeId: recipientId,
    });
    return ok(!!follower);
  }

  async sendFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      | FriendErrors.RequestAlreadySent
      | FriendErrors.AlreadyFriends
      | FriendErrors.CannotFriendSelf
      | FriendErrors.FailedToSendRequest
      | ProfileErrors.ProfileNotFound
    >
  > {
    const { senderId, recipientId } = options;

    // Check if the sender and recipient are the same
    if (senderId === recipientId) {
      return err(new FriendErrors.CannotFriendSelf(senderId));
    }

    // Get the sender and recipient profiles
    const [sender, recipient] = await Promise.all([
      this.userRepository.getUserWithProfile({ userId: senderId }),
      this.userRepository.getUserWithProfile({ userId: recipientId }),
    ]);

    if (!sender || !recipient) {
      return err(
        new ProfileErrors.ProfileNotFound(!sender ? senderId : recipientId),
      );
    }

    const existingRelationship = await this.relationshipRepository.getByUserIds(
      {
        userIdA: senderId,
        userIdB: recipientId,
      },
    );

    if (existingRelationship?.friendshipStatus === "friends") {
      return err(new FriendErrors.AlreadyFriends(senderId, recipientId));
    }

    await this.db.transaction(async (tx) => {
      // Create friend request
      await this.friendRepository.createFriendRequest(
        {
          senderId,
          recipientId,
        },
        tx,
      );

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

      if (notificationSettings?.friendRequests) {
        await this.notificationsRepository.storeNotification(
          {
            senderId,
            recipientId,
            notificationData: {
              eventType: "friend",
              entityType: "profile",
              entityId: senderId,
            },
          },
          undefined,
        );
      }
    });
    return ok(undefined);
  }

  async acceptFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      FriendErrors.RequestNotFound | FriendErrors.FailedToAcceptRequest
    >
  > {
    const { senderId, recipientId } = options;

    // Check if friend request exists
    const existingRequest = await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });

    if (!existingRequest) {
      return err(new FriendErrors.RequestNotFound(senderId, recipientId));
    }

    // Get notification settings
    const sender = await this.userRepository.getUser({ userId: senderId });
    if (!sender) {
      return err(new FriendErrors.FailedToAcceptRequest(senderId, recipientId));
    }

    await this.db.transaction(async (tx) => {
      // Delete friend request and create friendship
      await this.friendRepository.deleteFriendRequest(
        {
          senderId,
          recipientId,
        },
        tx,
      );
      await this.friendRepository.createFriend({ senderId, recipientId }, tx);

      // Accept follow request
      await this.followRepository.createFollower(
        {
          senderUserId: senderId,
          recipientUserId: recipientId,
        },
        tx,
      );
      await this.followRepository.createFollower(
        {
          senderUserId: recipientId,
          recipientUserId: senderId,
        },
        tx,
      );

      const notificationSettings =
        await this.notificationsRepository.getNotificationSettings({
          notificationSettingsId: sender.notificationSettingsId,
        });

      if (notificationSettings?.friendRequests) {
        await this.notificationsRepository.storeNotification({
          senderId: recipientId,
          recipientId: senderId,
          notificationData: {
            eventType: "friend",
            entityType: "profile",
            entityId: recipientId,
          },
        });
      }
    });

    return ok(undefined);
  }

  async declineFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      FriendErrors.RequestNotFound | FriendErrors.FailedToDeclineRequest
    >
  > {
    const { senderId, recipientId } = options;

    // Check if friend request exists
    const existingRequest = await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });

    if (!existingRequest) {
      return err(new FriendErrors.RequestNotFound(senderId, recipientId));
    }

    await this.db.transaction(async (tx) => {
      // Delete friend request
      await this.friendRepository.deleteFriendRequest(
        {
          senderId,
          recipientId,
        },
        tx,
      );

      // Delete follow request
      await this.followRepository.removeFollowRequest(
        senderId,
        recipientId,
        tx,
      );
    });

    return ok(undefined);
  }

  async cancelFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      void,
      FriendErrors.RequestNotFound | FriendErrors.FailedToCancelRequest
    >
  > {
    const { senderId, recipientId } = options;

    // Check if friend request exists
    const existingRequest = await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });

    if (!existingRequest) {
      return err(new FriendErrors.RequestNotFound(senderId, recipientId));
    }

    await this.db.transaction(async (tx) => {
      // Delete friend request
      await this.friendRepository.deleteFriendRequest(
        {
          senderId,
          recipientId,
        },
        tx,
      );

      // Delete follow request
      await this.followRepository.removeFollowRequest(
        senderId,
        recipientId,
        tx,
      );
    });

    return ok(undefined);
  }

  async getFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    Result<
      { senderId: string; recipientId: string; createdAt: Date } | undefined,
      never
    >
  > {
    const { senderId, recipientId } = options;
    const request = await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });
    return ok(
      request ? { senderId, recipientId, createdAt: new Date() } : undefined,
    );
  }

  async removeFriend(options: {
    targetUserId: string;
    otherUserId: string;
  }): Promise<
    Result<void, FriendErrors.NotFound | FriendErrors.FailedToRemove>
  > {
    const { targetUserId, otherUserId } = options;

    // Check if friendship exists
    const existingFriendship = await this.friendRepository.getFriendship({
      userIdA: targetUserId,
      userIdB: otherUserId,
    });

    if (!existingFriendship) {
      return err(new FriendErrors.NotFound(targetUserId, otherUserId));
    }

    await this.db.transaction(async (tx) => {
      // Remove friendship
      await this.friendRepository.removeFriend(
        {
          userIdA: targetUserId,
          userIdB: otherUserId,
        },
        tx,
      );

      // Remove follow relationship in both directions
      await this.followRepository.removeFollower(
        {
          followerId: targetUserId,
          followeeId: otherUserId,
        },
        tx,
      );
      await this.followRepository.removeFollower(
        {
          followerId: otherUserId,
          followeeId: targetUserId,
        },
        tx,
      );
    });

    return ok(undefined);
  }

  async countFriendRequests(options: {
    userId: string;
  }): Promise<Result<number, FriendErrors.FailedToCountRequests>> {
    const { userId } = options;
    const count = await this.friendRepository.countFriendRequests({ userId });
    return ok(count ?? 0);
  }

  async determineFriendState(options: {
    userId: string;
    targetUserId: string;
  }): Promise<Result<FriendStatus, never>> {
    const { userId, targetUserId } = options;

    // Check if they are friends
    const areFriends = await this.friendRepository.friendshipExists({
      userIdA: userId,
      userIdB: targetUserId,
    });

    if (areFriends) {
      return ok("friends");
    }

    // Check if there's a pending friend request
    const friendRequest = await this.friendRepository.getFriendRequest({
      senderId: targetUserId,
      recipientId: userId,
    });

    if (friendRequest) {
      return ok("inboundRequest");
    }

    const sentFriendRequest = await this.friendRepository.getFriendRequest({
      senderId: userId,
      recipientId: targetUserId,
    });

    if (sentFriendRequest) {
      return ok("outboundRequest");
    }

    return ok("notFriends");
  }

  async friendshipExists(options: {
    userIdA: string;
    userIdB: string;
  }): Promise<Result<boolean, never>> {
    const { userIdA, userIdB } = options;
    const exists = await this.friendRepository.friendshipExists({
      userIdA,
      userIdB,
    });
    return ok(exists);
  }
}

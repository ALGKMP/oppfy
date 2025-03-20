import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database, FriendStatus } from "@oppfy/db";

import { TYPES } from "../../container";
import { FriendErrors } from "../../errors/social/friend.error";
import type { IFollowRepository } from "../../interfaces/repositories/social/followRepository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friendRepository.interface";
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
    >
  > {
    const { senderId, recipientId } = options;

    if (senderId === recipientId) {
      return err(new FriendErrors.CannotFriendSelf(senderId));
    }

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      this.userRepository.getUserWithProfile({ userId: senderId }),
      this.userRepository.getUserWithProfile({ userId: recipientId }),
    ]);

    if (!sender || !recipient) {
      return err(new FriendErrors.FailedToSendRequest(senderId, recipientId));
    }

    // Check if friend request already exists
    const existingRequest = await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });

    if (existingRequest) {
      return err(new FriendErrors.RequestAlreadySent(senderId, recipientId));
    }

    // Check if they are already friends
    const existingFriendship = await this.friendRepository.getFriendship({
      userIdA: senderId,
      userIdB: recipientId,
    });

    if (existingFriendship) {
      return err(new FriendErrors.AlreadyFriends(senderId, recipientId));
    }

    try {
      // Create friend request
      await this.friendRepository.createFriendRequest({
        senderId,
        recipientId,
      });

      // Create follow request
      await this.followRepository.createFollowRequest({
        senderId,
        recipientId,
      });

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

      return ok(undefined);
    } catch (error) {
      return err(new FriendErrors.FailedToSendRequest(senderId, recipientId));
    }
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

    try {
      // Delete friend request and create friendship
      await this.friendRepository.deleteFriendRequest({
        senderId,
        recipientId,
      });
      await this.friendRepository.createFriend({ senderId, recipientId });

      // Accept follow request
      await this.followRepository.createFollower({
        senderUserId: senderId,
        recipientUserId: recipientId,
      });
      await this.followRepository.createFollower({
        senderUserId: recipientId,
        recipientUserId: senderId,
      });

      // Get notification settings
      const sender = await this.userRepository.getUser({ userId: senderId });
      if (!sender) {
        return err(
          new FriendErrors.FailedToAcceptRequest(senderId, recipientId),
        );
      }

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

      return ok(undefined);
    } catch (error) {
      return err(new FriendErrors.FailedToAcceptRequest(senderId, recipientId));
    }
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

    try {
      // Delete friend request
      await this.friendRepository.deleteFriendRequest({
        senderId,
        recipientId,
      });

      // Delete follow request
      await this.followRepository.removeFollowRequest(senderId, recipientId);

      return ok(undefined);
    } catch (error) {
      return err(
        new FriendErrors.FailedToDeclineRequest(senderId, recipientId),
      );
    }
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

    try {
      // Delete friend request
      await this.friendRepository.deleteFriendRequest({
        senderId,
        recipientId,
      });

      // Delete follow request
      await this.followRepository.removeFollowRequest(senderId, recipientId);

      return ok(undefined);
    } catch (error) {
      return err(new FriendErrors.FailedToCancelRequest(senderId, recipientId));
    }
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

    try {
      // Remove friendship
      await this.friendRepository.removeFriend({
        userIdA: targetUserId,
        userIdB: otherUserId,
      });

      // Remove follow relationship in both directions
      await this.followRepository.removeFollower({
        followerId: targetUserId,
        followeeId: otherUserId,
      });
      await this.followRepository.removeFollower({
        followerId: otherUserId,
        followeeId: targetUserId,
      });

      return ok(undefined);
    } catch (error) {
      return err(new FriendErrors.FailedToRemove(targetUserId, otherUserId));
    }
  }

  async countFriendRequests(options: {
    userId: string;
  }): Promise<Result<number, FriendErrors.FailedToCountRequests>> {
    const { userId } = options;
    try {
      const count = await this.friendRepository.countFriendRequests({ userId });
      return ok(count ?? 0);
    } catch (error) {
      return err(new FriendErrors.FailedToCountRequests());
    }
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

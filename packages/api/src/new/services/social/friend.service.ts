import { inject, injectable } from "inversify";

import type { Database, FriendStatus } from "@oppfy/db";

import { DomainError, ErrorCode } from "../../../errors";
import { TYPES } from "../../container";
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
  }): Promise<boolean> {
    const { senderId, recipientId } = options;
    const follower = await this.followRepository.getFollower(
      { followerId: senderId, followeeId: recipientId },
    );
    return !!follower;
  }

  async sendFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void> {
    const { senderId, recipientId } = options;

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      this.userRepository.getUserWithProfile({ userId: senderId }),
      this.userRepository.getUserWithProfile(
        { userId: recipientId },
      ),
    ]);

    if (!sender || !recipient) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    // Check if friend request already exists
    const existingRequest = await this.friendRepository.getFriendRequest(
      { senderId, recipientId }
    );

    if (existingRequest) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_ALREADY_SENT,
        "Friend request already exists",
      );
    }

    // Check if they are already friends
    const existingFriendship = await this.friendRepository.getFriendship(
      { userIdA: senderId, userIdB: recipientId },
    );

    if (existingFriendship) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_FRIENDS,
        "Users are already friends",
      );
    }

    // Create friend request
    await this.friendRepository.createFriendRequest(
      { senderId, recipientId },
    );

    // Create follow request
    await this.followRepository.createFollowRequest(
      { senderId, recipientId },
    );

    // Get notification settings
    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings(
        { notificationSettingsId: recipient.notificationSettingsId },
      );

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
  }

  async acceptFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void> {
    const { senderId, recipientId } = options;

    // Check if friend request exists
    const existingRequest = await this.friendRepository.getFriendRequest(
      { senderId, recipientId },
    );

    if (!existingRequest) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }

    // Delete friend request and create friendship
    await this.friendRepository.deleteFriendRequest(
      { senderId, recipientId },
    );
    await this.friendRepository.createFriend(
      { senderId, recipientId },
    );

    // Accept follow request
    await this.followRepository.createFollower(
      { senderUserId: senderId, recipientUserId: recipientId },
    );
    await this.followRepository.createFollower(
      { senderUserId: recipientId, recipientUserId: senderId },
    );

    // Get notification settings
    const sender = await this.userRepository.getUser(
      { userId: senderId },
    );
    if (!sender) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings(
        { notificationSettingsId: sender.notificationSettingsId },
      );

    if (notificationSettings?.friendRequests) {
      await this.notificationsRepository.storeNotification(
        {
          senderId: recipientId,
          recipientId: senderId,
          notificationData: {
            eventType: "friend",
            entityType: "profile",
            entityId: recipientId,
          },
        },
      );
    }
  }

  async declineFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void> {
    const { senderId, recipientId } = options;

    // Check if friend request exists
    const existingRequest = await this.friendRepository.getFriendRequest(
      { senderId, recipientId },
    );

    if (!existingRequest) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }

    // Delete friend request
    await this.friendRepository.deleteFriendRequest(
      { senderId, recipientId },
    );

    // Delete follow request
    await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
  }

  async cancelFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void> {
    const { senderId, recipientId } = options;

    // Check if friend request exists
    const existingRequest = await this.friendRepository.getFriendRequest(
      { senderId, recipientId },
    );

    if (!existingRequest) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }

    // Delete friend request
    await this.friendRepository.deleteFriendRequest(
      { senderId, recipientId },
    );

    // Delete follow request
    await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
  }

  async getFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<
    { senderId: string; recipientId: string; createdAt: Date } | undefined
  > {
    const { senderId, recipientId } = options;
    const request = await this.friendRepository.getFriendRequest(
      { senderId, recipientId },
    );
    return request
      ? { senderId, recipientId, createdAt: new Date() }
      : undefined;
  }

  async removeFriend(options: {
    targetUserId: string;
    otherUserId: string;
  }): Promise<void> {
    const { targetUserId, otherUserId } = options;

    // Check if friendship exists
    const existingFriendship = await this.friendRepository.getFriendship(
      { userIdA: targetUserId, userIdB: otherUserId },
    );

    if (!existingFriendship) {
      throw new DomainError(
        ErrorCode.FRIENDSHIP_NOT_FOUND,
        "Users are not friends",
      );
    }

    // Remove friendship
    await this.friendRepository.removeFriend(
      { userIdA: targetUserId, userIdB: otherUserId },
    );

    // Remove follow relationship in both directions
    await this.followRepository.removeFollower(
      { followerId: targetUserId, followeeId: otherUserId },
    );
    await this.followRepository.removeFollower(
      { followerId: otherUserId, followeeId: targetUserId },
    );
  }

  async countFriendRequests(options: { userId: string }): Promise<number> {
    const { userId } = options;
    const count = await this.friendRepository.countFriendRequests(
      { userId },
    );
    return count ?? 0;
  }

  async determineFriendState(options: {
    userId: string;
    targetUserId: string;
  }): Promise<FriendStatus> {
    const { userId, targetUserId } = options;

    // Check if they are friends
    const areFriends = await this.friendRepository.friendshipExists(
      { userIdA: userId, userIdB: targetUserId },
    );

    if (areFriends) {
      return "friends";
    }

    // Check if there's a pending friend request
    const friendRequest = await this.friendRepository.getFriendRequest(
      { senderId: targetUserId, recipientId: userId },
    );

    if (friendRequest) {
      return "inboundRequest";
    }

    const sentFriendRequest = await this.friendRepository.getFriendRequest(
      { senderId: userId, recipientId: targetUserId },
    );

    if (sentFriendRequest) {
      return "outboundRequest";
    }

    return "notFriends";
  }

  async friendshipExists(options: {
    userIdA: string;
    userIdB: string;
  }): Promise<boolean> {
    const { userIdA, userIdB } = options;
    return await this.friendRepository.friendshipExists(
      { userIdA, userIdB }
    );
  }
}

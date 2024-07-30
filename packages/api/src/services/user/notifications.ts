import { DomainError, ErrorCode } from "../../errors";
import { NotificationsRepository } from "../../repositories/user/notifications";
import type {
  EntityType,
  EventType,
  NotificationSettings,
  SendNotificationData,
  StoreNotificationData,
} from "../../repositories/user/notifications";
import { CloudFrontService } from "../aws/cloudfront";
import { UserService } from "./user";

export class NotificationsService {
  private notificationsRepository = new NotificationsRepository();

  private userService = new UserService();
  private cloudFrontService = new CloudFrontService();

  async getNotificationSettings(userId: string) {
    const user = await this.userService.getUser(userId);

    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND);
    }

    return notificationSettings;
  }

  async paginateNotifications(
    userId: string,
    cursor: { createdAt: Date; id: string } | null = null,
    pageSize = 10,
  ) {
    const items = await this.notificationsRepository.paginateNotifications(
      userId,
      cursor,
      pageSize,
    );

    const itemsWithProfilePictureUrls = items.map((notification) => {
      const { profilePictureKey, eventType, ...rest } = notification;

      const profilePictureUrl =
        this.cloudFrontService.getSignedUrlForProfilePicture(profilePictureKey);

      const { username } = rest;

      const message = (() => {
        switch (eventType) {
          case "like":
            return `${username} liked your post!`;
          case "post":
            return `New post from ${username}!`;
          case "comment":
            return `${username} commented on your post!`;
          case "follow":
            return `${username} started following you!`;
          case "friend":
            return `${username} is now your friend!`;
          case "followRequest":
            return `${username} wants to follow you!`;
          case "friendRequest":
            return `${username} sent you a friend request!`;
        }
      })();

      return {
        ...rest,
        message,
        profilePictureUrl,
      };
    });

    const nextCursor = items[items.length - 1];
    return {
      items: itemsWithProfilePictureUrls.slice(0, pageSize),
      nextCursor:
        items.length > pageSize && nextCursor
          ? { createdAt: nextCursor.createdAt, id: nextCursor.id }
          : null,
    };
  }

  async updateNotificationSettings(
    userId: string,
    newNotificationSettings: NotificationSettings,
  ) {
    const user = await this.userService.getUser(userId);

    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND);
    }
    await this.notificationsRepository.updateNotificationSettings(
      user.notificationSettingsId,
      newNotificationSettings,
    );
  }

  async storeNotification(
    senderId: string,
    recipientId: string,
    notificationData: StoreNotificationData,
  ) {
    await this.notificationsRepository.storeNotification(
      senderId,
      recipientId,
      notificationData,
    );
  }

  async sendNotification(
    senderId: string,
    recipientId: string,
    notificationData: SendNotificationData,
  ) {
    const pushTokens =
      await this.notificationsRepository.getPushTokens(recipientId);

    if (pushTokens.length === 0) return;

    await this.notificationsRepository.sendNotification(
      pushTokens,
      senderId,
      recipientId,
      notificationData,
    );
  }

  async storePushToken(userId: string, pushToken: string) {
    await this.notificationsRepository.storePushToken(userId, pushToken);
  }

  async deleteNotificationById(id: number) {
    await this.notificationsRepository.deleteNotificationById(id);
  }

  async deleteAllNotificationsForRecipient(recipientId: string) {
    await this.notificationsRepository.deleteNotificationsForRecipient(
      recipientId,
    );
  }

  async deleteFollowRequestNotification(senderId: string, recipientId: string) {
    await this.notificationsRepository.deleteNotificationBetweenUsers(
      senderId,
      recipientId,
      { eventType: "followRequest" },
    );
  }

  async deleteFriendRequestNotification(senderId: string, recipientId: string) {
    await this.notificationsRepository.deleteNotificationBetweenUsers(
      senderId,
      recipientId,
      { eventType: "friendRequest" },
    );
  }

  async deleteAllPostNotifications(postId: string) {
    await this.notificationsRepository.deleteNotificationsForEntity(
      postId,
      "post",
    );
  }

  async deleteAllCommentNotifications(commentId: string) {
    await this.notificationsRepository.deleteNotificationsForEntity(
      commentId,
      "comment",
    );
  }

  async deleteLikeNotification(senderId: string, recipientId: string) {
    await this.notificationsRepository.deleteNotificationBetweenUsers(
      senderId,
      recipientId,
      { eventType: "like" },
    );
  }

  async deleteAllNotificationsFromSender(senderId: string) {
    await this.notificationsRepository.deleteNotificationsFromSender(senderId);
  }

  async deleteAllFriendRelatedNotificationsBetweenUsers(
    userId1: string,
    userId2: string,
  ) {
    await this.notificationsRepository.deleteNotificationBetweenUsers(
      userId1,
      userId2,
      { eventType: ["friendRequest", "friend"] },
    );
    await this.notificationsRepository.deleteNotificationBetweenUsers(
      userId2,
      userId1,
      { eventType: ["friendRequest", "friend"] },
    );
  }

  async deleteSpecificNotificationsForRecipient(
    recipientId: string,
    options: {
      eventType?: EventType | EventType[];
      entityType?: EntityType;
    },
  ) {
    await this.notificationsRepository.deleteNotificationsForRecipient(
      recipientId,
      options,
    );
  }

  async deleteSpecificNotificationsFromSender(
    senderId: string,
    options: {
      eventType?: EventType | EventType[];
      entityType?: EntityType;
    },
  ) {
    await this.notificationsRepository.deleteNotificationsFromSender(
      senderId,
      options,
    );
  }
}

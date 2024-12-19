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

  async getUnreadNotificationsCount(userId: string) {
    return this.notificationsRepository.getUnreadNotificationsCount(userId);
  }

  async getRecentNotifications(options: {
    senderId?: string;
    recipientId?: string;
    eventType?: EventType;
    entityId?: string;
    entityType?: EntityType;
    minutesThreshold: number;
    limit: number;
  }) {
    return this.notificationsRepository.getRecentNotifications(options);
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

    const itemsWithProfilePictureUrls = await Promise.all(
      items.map(async (notification) => {
        const { profilePictureKey, ...rest } = notification;

        const profilePictureUrl = profilePictureKey
          ? await this.cloudFrontService.getSignedUrlForProfilePicture(
              profilePictureKey,
            )
          : null;

        return {
          ...rest,
          profilePictureUrl,
        };
      }),
    );

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

  async deletePushToken(userId: string, pushToken: string) {
    await this.notificationsRepository.deletePushToken(userId, pushToken);
  }

  async deleteNotification(id: string) {
    await this.notificationsRepository.deleteNotificationById(id);
  }

  async deleteNotifications(options: {
    senderId?: string;
    recipientId?: string;
    eventType?: EventType | EventType[];
    entityType?: EntityType;
    entityId?: string;
  }) {
    await this.notificationsRepository.deleteNotifications(options);
  }

  async deleteNotificationFromSenderToRecipient(
    senderId: string,
    recipientId: string,
    options: {
      eventType?: EventType | EventType[];
      entityType?: EntityType;
      entityId?: string;
    },
  ) {
    await this.notificationsRepository.deleteNotifications({
      senderId,
      recipientId,
      ...options,
    });
  }

  async deleteAllNotificationsForUser(userId: string) {
    await this.deleteNotifications({ recipientId: userId });
  }

  async deleteAllNotificationsForEntity(
    entityId: string,
    entityType: EntityType,
  ) {
    await this.deleteNotifications({ entityId, entityType });
  }
}

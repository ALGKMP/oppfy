import { DomainError, ErrorCode } from "../../errors";
import { SnsRepository } from "../../repositories/aws/sns";
import { NotificationsRepository } from "../../repositories/user/notifications";
import type {
  NotificationSettings,
  SendNotificationData,
  SnsNotificationData,
  StoreNotificationData,
} from "../../repositories/user/notifications";
import { UserService } from "./user";

export class NotificationsService {
  private notificationsRepository = new NotificationsRepository();

  private userService = new UserService();

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
    cursor: { createdAt: Date } | null = null,
    pageSize = 10,
  ) {
    const data = await this.notificationsRepository.paginateNotifications(
      userId,
      cursor,
      pageSize,
    );

    return {
      data,
      nextCursor: data.length
        ? data[data.length - 1]?.createdAt.toISOString()
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
    const pushToken =
      await this.notificationsRepository.getPushToken(recipientId);

    if (pushToken === null) {
      throw new DomainError(ErrorCode.PUSH_TOKEN_NOT_FOUND);
    }

    await this.notificationsRepository.sendNotification(
      pushToken,
      senderId,
      recipientId,
      notificationData,
    );
  }

  async storePushToken(userId: string, pushToken: string) {
    await this.notificationsRepository.updatePushToken(userId, pushToken);
  }
}

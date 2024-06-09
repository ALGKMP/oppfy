import { DomainError, ErrorCode } from "../../errors";
import { NotificationsRepository } from "../../repositories/user/notifications";
import type {
  NotificationData,
  NotificationSettings,
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

  async storeNotification(userId: string, notificationData: NotificationData) {
    await this.notificationsRepository.storeNotification(
      userId,
      notificationData,
    );
  }

  async sendNotification(userId: string, notificationData: NotificationData) {
    await this.notificationsRepository.sendNotification(
      userId,
      notificationData,
    );
  }

  async storePushToken(userId: string, pushToken: string) {
    await this.notificationsRepository.updatePushToken(userId, pushToken);
  }
}

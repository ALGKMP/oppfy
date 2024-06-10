import { eq } from "drizzle-orm";
import type { z } from "zod";

import { db, schema } from "@oppfy/db";
import { PublishCommand, sns } from "@oppfy/sns";
import type { sharedValidators, trpcValidators } from "@oppfy/validators";

import { DomainError, ErrorCode, handleDatabaseErrors } from "../../errors";

export type NotificationData = z.infer<
  typeof sharedValidators.notifications.notificationData
>;

type SnsNotificationData = z.infer<
  typeof sharedValidators.notifications.snsNotificationData
>;

export type NotificationSettings = z.infer<
  typeof trpcValidators.input.notifications.updateNotificationSettings
>;

export class NotificationsRepository {
  private db = db;
  private sns = sns;

  @handleDatabaseErrors
  async updatePushToken(userId: string, pushToken: string) {
    await this.db
      .update(schema.user)
      .set({ pushToken })
      .where(eq(schema.user.id, userId));
  }

  @handleDatabaseErrors
  async getNotificationSettings(notificationSettingId: number) {
    const possibleNotificationSettings =
      await this.db.query.notificationSettings.findFirst({
        where: eq(schema.notificationSettings.id, notificationSettingId),
        columns: {
          posts: true,
          likes: true,
          comments: true,
          mentions: true,
          friendRequests: true,
          followRequests: true,
        },
      });

    return possibleNotificationSettings;
  }

  @handleDatabaseErrors
  async updateNotificationSettings(
    notificationSettingsId: number,
    notificationSettings: NotificationSettings,
  ) {
    await this.db
      .update(schema.notificationSettings)
      .set({
        ...notificationSettings,
      })
      .where(eq(schema.notificationSettings.id, notificationSettingsId));
  }

  @handleDatabaseErrors
  async storeNotification(userId: string, notificationData: NotificationData) {
    await this.db
      .insert(schema.notifications)
      .values({ recipientId: userId, ...notificationData });
  }

  async sendNotification(userId: string, notificationData: NotificationData) {
    // get the pushToken
    const pushToken = await this._getPushToken(userId);

    if (pushToken === null) {
      throw new DomainError(ErrorCode.UNREGISTERED_PUSH_TOKEN);
    }

    const params = {
      Message: JSON.stringify({
        pushToken,
        ...notificationData,
      } satisfies SnsNotificationData),
      Subject: "New notification",
      TopicArn: process.env.PUSH_NOTIFICATION_TOPIC_ARN,
    };

    await this.sns.send(new PublishCommand(params));
  }

  @handleDatabaseErrors
  private async _getPushToken(userId: string) {
    const user = await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      columns: {
        pushToken: true,
      },
    });

    if (user === undefined) {
      throw new DomainError(ErrorCode.USERNAME_NOT_FOUND);
    }

    return user.pushToken;
  }
}

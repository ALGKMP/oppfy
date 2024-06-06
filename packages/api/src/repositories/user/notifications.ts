import { eq } from "drizzle-orm";
import type { z } from "zod";

import { db, schema } from "@oppfy/db";
import type { trpcValidators } from "@oppfy/validators";

import { handleDatabaseErrors } from "../../errors";

export type NotificationSettings = z.infer<
  typeof trpcValidators.input.notifications.updateNotificationSettings
>;

export class NotificationsRepository {
  private db = db;

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
}

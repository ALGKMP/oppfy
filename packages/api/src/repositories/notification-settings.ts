import { eq } from "drizzle-orm";
import type { z } from "zod";

import { db, schema } from "@acme/db";
import type { trpcValidators } from "@acme/validators";

import { handleDatabaseErrors } from "../errors";

export type NotificationSettings = z.infer<
  typeof trpcValidators.user.updateNotificationSettings
>;

export class NotificationSettingsRepository {
  private db = db;

  @handleDatabaseErrors
  async getNotificationSettings(notificationSettingId: number) {
    return await this.db.query.notificationSettings.findFirst({
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

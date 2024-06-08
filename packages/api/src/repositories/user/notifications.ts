import { eq } from "drizzle-orm";
import type { z } from "zod";

import { db, InferInsertModel, schema } from "@oppfy/db";
import type { trpcValidators } from "@oppfy/validators";

import { handleDatabaseErrors } from "../../errors";

type Notifications = InferInsertModel<typeof schema.notifications>;
type EntityTypes = Notifications["entityType"];

interface Entity {
  id: string;
  type: EntityTypes;
}

interface Notification {
  recipientId: string;

  title: string;
  body: string;

  entity: Entity;
}

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

  @handleDatabaseErrors
  async storeNotification({
    recipientId,

    title,
    body,

    entity,
  }: Notification) {
    await this.db.insert(schema.notifications).values({
      recipientId,

      title,
      body,

      entityId: entity.id,
      entityType: entity.type,
    });
  }
}

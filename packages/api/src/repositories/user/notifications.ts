import type { z } from "zod";

import {
  aliasedTable,
  and,
  asc,
  db,
  desc,
  eq,
  gt,
  or,
  schema,
  sql,
} from "@oppfy/db";
import { env } from "@oppfy/env";
import { PublishCommand, sns } from "@oppfy/sns";
import type { sharedValidators, trpcValidators } from "@oppfy/validators";

import { DomainError, ErrorCode, handleDatabaseErrors } from "../../errors";

export type EventType = z.infer<
  typeof sharedValidators.notifications.eventType
>;

export type StoreNotificationData = z.infer<
  typeof sharedValidators.notifications.notificationData
>;

export type SendNotificationData = z.infer<
  typeof sharedValidators.notifications.sendNotificationData
>;

export type SnsNotificationData = z.infer<
  typeof sharedValidators.notifications.snsNotificationData
>;

export type NotificationSettings = z.infer<
  typeof trpcValidators.input.notifications.updateNotificationSettings
>;

export class NotificationsRepository {
  private db = db;
  private sns = sns;

  @handleDatabaseErrors
  async storePushToken(userId: string, pushToken: string) {
    await this.db
      .insert(schema.pushToken)
      .values({ userId, token: pushToken })
      .onConflictDoUpdate({
        target: schema.pushToken.token,
        set: {
          token: pushToken,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });
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
  async paginateNotifications(
    userId: string,
    cursor: { createdAt: Date } | null = null,
    pageSize = 10,
  ) {
    const notifications = await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        username: schema.profile.username,
        profilePictureKey: schema.profile.profilePictureKey,
        eventType: schema.notifications.eventType,
        entityId: schema.notifications.entityId,
        entityType: schema.notifications.entityType,
        createdAt: schema.notifications.createdAt,
        privacySetting: schema.user.privacySetting,
        relationshipState: sql<
          "following" | "followRequestSent" | "notFollowing"
        >`
        CASE
          WHEN EXISTS (
            SELECT 1 FROM ${schema.follower} f
            WHERE f.senderId = ${userId} AND f.recipientId = ${schema.user.id}
          ) THEN 'following'
          WHEN EXISTS (
            SELECT 1 FROM ${schema.followRequest} fr
            WHERE fr.senderId = ${userId} AND fr.recipientId = ${schema.user.id}
          ) THEN 'followRequestSent'
          ELSE 'notFollowing'
        END
      `,
      })
      .from(schema.notifications)
      .innerJoin(schema.user, eq(schema.notifications.senderId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.notifications.recipientId, userId),
          cursor
            ? gt(schema.notifications.createdAt, cursor.createdAt)
            : undefined,
        ),
      )
      .orderBy(
        desc(schema.notifications.createdAt),
        desc(schema.notifications.id),
      )
      .limit(pageSize);

    return notifications;
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
  async storeNotification(
    senderId: string,
    recipientId: string,
    notificationData: StoreNotificationData,
  ) {
    await this.db.insert(schema.notifications).values({
      senderId,
      recipientId,
      ...notificationData,
    });
  }

  @handleDatabaseErrors
  async deleteNotification(
    senderId: string,
    eventType?: EventType | EventType[],
  ) {
    const eventTypes = Array.isArray(eventType)
      ? eventType
      : eventType
        ? [eventType]
        : [];

    await this.db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.senderId, senderId),
          or(
            ...eventTypes.map((eventType) =>
              eq(schema.notifications.eventType, eventType),
            ),
          ),
        ),
      );
  }

  async sendNotification(
    pushTokens: string[],
    senderId: string,
    recipientId: string,
    notificationData: SendNotificationData,
  ) {
    const message = {
      senderId,
      recipientId,
      pushTokens,
      ...notificationData,
    } satisfies SnsNotificationData;

    const params = {
      Subject: "New notification",
      TopicArn: env.SNS_PUSH_NOTIFICATION_TOPIC_ARN,
      Message: JSON.stringify(message),
    };

    await this.sns.send(new PublishCommand(params));
  }

  @handleDatabaseErrors
  async getPushTokens(userId: string) {
    const possiblePushTokens = await this.db.query.pushToken.findMany({
      where: eq(schema.pushToken.userId, userId),
      columns: {
        token: true,
      },
    });

    return possiblePushTokens.map((pushToken) => pushToken.token);
  }
}

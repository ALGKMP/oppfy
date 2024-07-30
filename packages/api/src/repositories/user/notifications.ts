import type { PgDelete } from "drizzle-orm/pg-core";
import type { z } from "zod";

import { and, db, desc, eq, inArray, lt, or, schema, sql } from "@oppfy/db";
import { env } from "@oppfy/env";
import { PublishCommand, sns } from "@oppfy/sns";
import type { sharedValidators, trpcValidators } from "@oppfy/validators";

import type { entityTypeEnum } from "../../../../db/src/schema";
import { handleDatabaseErrors } from "../../errors";

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

export type EntityType = (typeof entityTypeEnum.enumValues)[number];

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
    cursor: { createdAt: Date; id: string } | null = null,
    pageSize = 10,
  ) {
    const notifications = await this.db
      .select({
        id: schema.notifications.id, // Add this line to select the notification id
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
          SELECT 1 FROM ${schema.follower}
          WHERE ${schema.follower.senderId} = ${userId} AND ${schema.follower.recipientId} = ${schema.user.id}
        ) THEN 'following'
        WHEN EXISTS (
          SELECT 1 FROM ${schema.followRequest}
          WHERE ${schema.followRequest.senderId} = ${userId} AND ${schema.followRequest.recipientId} = ${schema.user.id}
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
            ? or(
                lt(schema.notifications.createdAt, cursor.createdAt),
                and(
                  eq(schema.notifications.createdAt, cursor.createdAt),
                  lt(schema.notifications.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        desc(schema.notifications.createdAt),
        desc(schema.notifications.id),
      )
      .limit(pageSize + 1);
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

  async deleteNotificationById(id: number) {
    await this.db
      .delete(schema.notifications)
      .where(eq(schema.notifications.id, id));
  }

  async deleteNotificationsForRecipient(
    recipientId: string,
    options?: {
      eventType?: EventType | EventType[];
      entityType?: EntityType;
    },
  ) {
    let query = this.db.delete(schema.notifications).$dynamic();
    query = query.where(eq(schema.notifications.recipientId, recipientId));

    if (options?.eventType) {
      if (Array.isArray(options.eventType)) {
        query = query.where(
          inArray(schema.notifications.eventType, options.eventType),
        );
      } else {
        query = query.where(
          eq(schema.notifications.eventType, options.eventType),
        );
      }
    }

    if (options?.entityType) {
      query = query.where(
        eq(schema.notifications.entityType, options.entityType),
      );
    }

    await query;
  }

  async deleteNotificationsFromSender(
    senderId: string,
    options?: {
      eventType?: EventType | EventType[];
      entityType?: EntityType;
    },
  ) {
    let query = this.db.delete(schema.notifications).$dynamic();
    query = query.where(eq(schema.notifications.senderId, senderId));

    if (options?.eventType) {
      if (Array.isArray(options.eventType)) {
        query = query.where(
          inArray(schema.notifications.eventType, options.eventType),
        );
      } else {
        query = query.where(
          eq(schema.notifications.eventType, options.eventType),
        );
      }
    }

    if (options?.entityType) {
      query = query.where(
        eq(schema.notifications.entityType, options.entityType),
      );
    }

    await query;
  }

  async deleteNotificationsForEntity(entityId: string, entityType: EntityType) {
    await this.db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.entityId, entityId),
          eq(schema.notifications.entityType, entityType),
        ),
      );
  }

  async deleteNotificationBetweenUsers(
    senderId: string,
    recipientId: string,
    options: {
      eventType: EventType | EventType[];
      entityType?: EntityType;
    },
  ) {
    let query = this.db.delete(schema.notifications).$dynamic();
    query = query.where(eq(schema.notifications.senderId, senderId));
    query = query.where(eq(schema.notifications.recipientId, recipientId));

    if (Array.isArray(options.eventType)) {
      query = query.where(
        inArray(schema.notifications.eventType, options.eventType),
      );
    } else {
      query = query.where(
        eq(schema.notifications.eventType, options.eventType),
      );
    }

    if (options.entityType) {
      query = query.where(
        eq(schema.notifications.entityType, options.entityType),
      );
    }

    await query;
  }
}

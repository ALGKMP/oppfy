import type { z } from "zod";

import {
  and,
  count,
  db,
  desc,
  eq,
  inArray,
  lt,
  or,
  schema,
  sql,
} from "@oppfy/db";
import { env } from "@oppfy/env";
import { PublishCommand, sns } from "@oppfy/sns";
import type { sharedValidators } from "@oppfy/validators";

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
  typeof sharedValidators.notifications.updateNotificationSettings
>;

export type EntityType = (typeof entityTypeEnum.enumValues)[number];

export class NotificationsRepository {
  private db = db;
  private sns = sns;

  @handleDatabaseErrors
  async storePushToken(userId: string, pushToken: string) {
    await this.db.transaction(async (tx) => {
      const pushTokenData = await tx.query.pushToken.findFirst({
        where: and(
          eq(schema.pushToken.userId, userId),
          eq(schema.pushToken.token, pushToken),
        ),
      });

      if (pushTokenData === undefined) {
        await tx.insert(schema.pushToken).values({
          userId,
          token: pushToken,
        });
        return;
      }

      await tx
        .update(schema.pushToken)
        .set({
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(
          and(
            eq(schema.pushToken.userId, userId),
            eq(schema.pushToken.token, pushToken),
          ),
        );
    });
  }

  @handleDatabaseErrors
  async deletePushToken(userId: string, pushToken: string) {
    await this.db
      .delete(schema.pushToken)
      .where(
        and(
          eq(schema.pushToken.userId, userId),
          eq(schema.pushToken.token, pushToken),
        ),
      );
  }

  @handleDatabaseErrors
  async getNotificationSettings(notificationSettingId: string) {
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
  async getUnreadNotificationsCount(userId: string) {
    const result = await this.db
      .select({
        count: count(),
      })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.recipientId, userId),
          eq(schema.notifications.read, false),
        ),
      );

    const unreadNotificationsCount = result[0]?.count ?? 0;
    return unreadNotificationsCount;
  }

  @handleDatabaseErrors
  async paginateNotifications(
    userId: string,
    cursor: { createdAt: Date; id: string } | null = null,
    pageSize = 10,
  ) {
    const notifications = await this.db.transaction(async (tx) => {
      const fetchedNotifications = await tx
        .select({
          id: schema.notifications.id,
          userId: schema.user.id,
          profileId: schema.profile.id,
          username: schema.profile.username,
          profilePictureKey: schema.profile.profilePictureKey,
          eventType: schema.notifications.eventType,
          entityId: schema.notifications.entityId,
          entityType: schema.notifications.entityType,
          createdAt: schema.notifications.createdAt,
          read: schema.notifications.read,
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
        .innerJoin(
          schema.user,
          eq(schema.notifications.senderId, schema.user.id),
        )
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

      if (fetchedNotifications.length === 0) {
        return [];
      }

      console.log("MARKING NOTIS AS READ:", fetchedNotifications);

      // Mark notis as read
      const notificationIds = fetchedNotifications.map((n) => n.id);
      await tx
        .update(schema.notifications)
        .set({ read: true })
        .where(
          and(
            eq(schema.notifications.recipientId, userId),
            inArray(schema.notifications.id, notificationIds),
            eq(schema.notifications.read, false),
          ),
        );

      return fetchedNotifications;
    });

    return notifications;
  }

  @handleDatabaseErrors
  async updateNotificationSettings(
    notificationSettingsId: string,
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

  async deleteNotificationById(id: string) {
    await this.db
      .delete(schema.notifications)
      .where(eq(schema.notifications.id, id));
  }

  async deleteNotifications(options: {
    senderId?: string;
    recipientId?: string;
    eventType?: EventType | EventType[];
    entityType?: EntityType;
    entityId?: string;
  }) {
    console.log(
      "Deleting notifications with options:",
      JSON.stringify(options, null, 2),
    );

    let query = this.db.delete(schema.notifications).$dynamic();

    const conditions = [];

    if (options.senderId) {
      conditions.push(eq(schema.notifications.senderId, options.senderId));
    }
    if (options.recipientId) {
      conditions.push(
        eq(schema.notifications.recipientId, options.recipientId),
      );
    }
    if (options.eventType) {
      if (Array.isArray(options.eventType)) {
        conditions.push(
          inArray(schema.notifications.eventType, options.eventType),
        );
      } else {
        conditions.push(eq(schema.notifications.eventType, options.eventType));
      }
    }
    if (options.entityType) {
      conditions.push(eq(schema.notifications.entityType, options.entityType));
    }
    if (options.entityId) {
      conditions.push(eq(schema.notifications.entityId, options.entityId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    await query;
  }
}

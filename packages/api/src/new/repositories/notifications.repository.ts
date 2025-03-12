import { and, count, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
} from "@oppfy/db";

import { TYPES } from "../container";
import {
  DeleteNotificationByIdParams,
  DeleteNotificationsBetweenUsersParams,
  DeleteNotificationsParams,
  DeletePushTokenParams,
  GetNotificationSettingsParams,
  GetPushTokensParams,
  GetRecentNotificationsParams,
  GetUnreadNotificationsCountParams,
  INotificationsRepository,
  NotificationResult,
  NotificationSettings,
  PaginateNotificationsParams,
  StoreNotificationParams,
  StorePushTokenParams,
  UpdateNotificationSettingsParams,
} from "../interfaces/repositories/notificationsRepository.interface";

@injectable()
export class NotificationsRepository implements INotificationsRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async storePushToken(
    params: StorePushTokenParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, pushToken } = params;

    const pushTokenData = await db.query.pushToken.findFirst({
      where: and(
        eq(this.schema.pushToken.userId, userId),
        eq(this.schema.pushToken.token, pushToken),
      ),
    });

    if (pushTokenData === undefined) {
      await db
        .insert(this.schema.pushToken)
        .values({ userId, token: pushToken });
      return;
    }

    await db
      .update(this.schema.pushToken)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(
        and(
          eq(this.schema.pushToken.userId, userId),
          eq(this.schema.pushToken.token, pushToken),
        ),
      );
  }

  async deletePushToken(
    params: DeletePushTokenParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, pushToken } = params;

    await db
      .delete(this.schema.pushToken)
      .where(
        and(
          eq(this.schema.pushToken.userId, userId),
          eq(this.schema.pushToken.token, pushToken),
        ),
      );
  }

  async getNotificationSettings(
    params: GetNotificationSettingsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<NotificationSettings | undefined> {
    const { notificationSettingsId } = params;

    const possibleNotificationSettings =
      await db.query.notificationSettings.findFirst({
        where: eq(this.schema.notificationSettings.id, notificationSettingsId),
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

  async getUnreadNotificationsCount(
    params: GetUnreadNotificationsCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.notifications)
      .where(
        and(
          eq(this.schema.notifications.recipientId, userId),
          eq(this.schema.notifications.read, false),
        ),
      );

    const unreadNotificationsCount = result[0]?.count ?? 0;
    return unreadNotificationsCount;
  }

  async getRecentNotifications(
    params: GetRecentNotificationsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<NotificationResult[]> {
    const {
      senderId,
      recipientId,
      eventType,
      entityId,
      entityType,
      minutesThreshold,
      limit,
    } = params;

    let query = db.select().from(this.schema.notifications).$dynamic();

    query = query.where(
      gt(
        this.schema.notifications.createdAt,
        sql`NOW() - INTERVAL '${minutesThreshold} minutes'`,
      ),
    );

    if (senderId)
      query = query.where(eq(this.schema.notifications.senderId, senderId));
    if (recipientId)
      query = query.where(
        eq(this.schema.notifications.recipientId, recipientId),
      );
    if (eventType)
      query = query.where(eq(this.schema.notifications.eventType, eventType));
    if (entityId)
      query = query.where(eq(this.schema.notifications.entityId, entityId));
    if (entityType)
      query = query.where(eq(this.schema.notifications.entityType, entityType));

    query = query
      .orderBy(desc(this.schema.notifications.createdAt))
      .limit(limit);

    return await query;
  }

  async paginateNotifications(
    params: PaginateNotificationsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<NotificationResult[]> {
    const { userId, cursor = null, pageSize = 10 } = params;

    const notifications = await db.transaction(async (db) => {
      const fetchedNotifications = await db
        .select({
          id: this.schema.notifications.id,
          senderId: this.schema.notifications.senderId,
          recipientId: this.schema.notifications.recipientId,
          userId: this.schema.user.id,
          profileId: this.schema.profile.id,
          name: this.schema.profile.name,
          username: this.schema.profile.username,
          profilePictureKey: this.schema.profile.profilePictureKey,
          eventType: this.schema.notifications.eventType,
          entityId: this.schema.notifications.entityId,
          entityType: this.schema.notifications.entityType,
          createdAt: this.schema.notifications.createdAt,
          read: this.schema.notifications.read,
          privacySetting: this.schema.user.privacySetting,
          relationshipState: sql<
            "following" | "followRequestSent" | "notFollowing"
          >`
      CASE
        WHEN EXISTS (
          SELECT 1 FROM ${this.schema.follow}
          WHERE ${this.schema.follow.senderId} = ${userId} AND ${this.schema.follow.recipientId} = ${this.schema.user.id}
        ) THEN 'following'
        WHEN EXISTS (
          SELECT 1 FROM ${this.schema.followRequest}
          WHERE ${this.schema.followRequest.senderId} = ${userId} AND ${this.schema.followRequest.recipientId} = ${this.schema.user.id}
        ) THEN 'followRequestSent'
        ELSE 'notFollowing'
      END
    `,
        })
        .from(this.schema.notifications)
        .innerJoin(
          this.schema.user,
          eq(this.schema.notifications.senderId, this.schema.user.id),
        )
        .innerJoin(
          this.schema.profile,
          eq(this.schema.user.id, this.schema.profile.userId),
        )
        .where(
          and(
            eq(this.schema.notifications.recipientId, userId),
            cursor
              ? or(
                  lt(this.schema.notifications.createdAt, cursor.createdAt),
                  and(
                    eq(this.schema.notifications.createdAt, cursor.createdAt),
                    lt(this.schema.notifications.id, cursor.id),
                  ),
                )
              : undefined,
          ),
        )
        .orderBy(
          desc(this.schema.notifications.createdAt),
          desc(this.schema.notifications.id),
        )
        .limit(pageSize + 1);

      if (fetchedNotifications.length === 0) {
        return [];
      }

      // Mark all notifications as read for this user
      await db
        .update(this.schema.notifications)
        .set({ read: true })
        .where(eq(this.schema.notifications.recipientId, userId));

      return fetchedNotifications;
    });

    return notifications.filter((notification) => notification.name !== null);
  }

  async updateNotificationSettings(
    params: UpdateNotificationSettingsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { notificationSettingsId, notificationSettings } = params;

    await db
      .update(this.schema.notificationSettings)
      .set({ ...notificationSettings })
      .where(eq(this.schema.notificationSettings.id, notificationSettingsId));
  }

  async storeNotification(
    params: StoreNotificationParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { senderId, recipientId, notificationData } = params;

    await db
      .insert(this.schema.notifications)
      .values({ senderId, recipientId, ...notificationData });
  }

  async getPushTokens(
    params: GetPushTokensParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<string[]> {
    const { userId } = params;

    const pushTokens = await db.query.pushToken.findMany({
      where: eq(this.schema.pushToken.userId, userId),
      columns: { token: true },
    });

    return pushTokens.map((pushToken) => pushToken.token);
  }

  async deleteNotificationById(
    params: DeleteNotificationByIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { id } = params;

    await db
      .delete(this.schema.notifications)
      .where(eq(this.schema.notifications.id, id));
  }

  async deleteNotifications(
    params: DeleteNotificationsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { senderId, recipientId, eventType, entityType, entityId } = params;

    let query = db.delete(this.schema.notifications).$dynamic();

    const conditions = [];

    if (senderId) {
      conditions.push(eq(this.schema.notifications.senderId, senderId));
    }
    if (recipientId) {
      conditions.push(eq(this.schema.notifications.recipientId, recipientId));
    }
    if (eventType) {
      if (Array.isArray(eventType)) {
        conditions.push(
          inArray(this.schema.notifications.eventType, eventType),
        );
      } else {
        conditions.push(eq(this.schema.notifications.eventType, eventType));
      }
    }
    if (entityType) {
      conditions.push(eq(this.schema.notifications.entityType, entityType));
    }
    if (entityId) {
      conditions.push(eq(this.schema.notifications.entityId, entityId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    await query;
  }

  async deleteNotificationsBetweenUsers(
    params: DeleteNotificationsBetweenUsersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userIdA, userIdB } = params;

    await db
      .delete(this.schema.notifications)
      .where(
        or(
          and(
            eq(this.schema.notifications.senderId, userIdA),
            eq(this.schema.notifications.recipientId, userIdB),
          ),
          and(
            eq(this.schema.notifications.senderId, userIdB),
            eq(this.schema.notifications.recipientId, userIdA),
          ),
        ),
      );
  }
}

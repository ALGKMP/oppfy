import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";

import type { Schema } from "../..";

export type FollowStatus = "FOLLOWING" | "REQUESTED" | "NOT_FOLLOWING";
export type FriendStatus = "FRIENDS" | "REQUESTED" | "NOT_FRIENDS";
export type BlockStatus = "BLOCKED" | "NOT_BLOCKED";
export type Privacy = "PUBLIC" | "PRIVATE";

/**
 * Only include profiles of users who have completed onboarding
 */
export const withOnboardingCompleted = <T extends PgSelect>(
  qb: T,
  schema: Schema,
) => {
  return qb
    .innerJoin(
      schema.userStatus,
      eq(schema.userStatus.userId, schema.profile.userId),
    )
    .where(eq(schema.userStatus.hasCompletedOnboarding, true));
};

/**
 * Exclude profiles that have blocked or been blocked by the given user
 */
export const withoutBlocked = <T extends PgSelect>(
  qb: T,
  schema: Schema,
  userId: string,
) => {
  return qb
    .leftJoin(
      schema.block,
      or(
        and(
          eq(schema.block.senderUserId, userId),
          eq(schema.block.recipientUserId, schema.profile.userId),
        ),
        and(
          eq(schema.block.recipientUserId, userId),
          eq(schema.block.senderUserId, schema.profile.userId),
        ),
      ),
    )
    .where(isNull(schema.block.id));
};

export const getFollowStatusSql = (schema: Schema, currentUserId: string) => {
  return sql<FollowStatus>`CASE
    WHEN EXISTS (
      SELECT 1 FROM ${schema.follow}
      WHERE ${schema.follow.senderUserId} = ${currentUserId}
      AND ${schema.follow.recipientUserId} = ${schema.profile.userId}
    ) THEN 'FOLLOWING'
    WHEN EXISTS (
      SELECT 1 FROM ${schema.followRequest}
      WHERE ${schema.followRequest.senderUserId} = ${currentUserId}
      AND ${schema.followRequest.recipientUserId} = ${schema.profile.userId}
    ) THEN 'REQUESTED'
    ELSE 'NOT_FOLLOWING'
  END`;
};

export const getFriendStatusSql = (schema: Schema, currentUserId: string) => {
  return sql<FriendStatus>`CASE
    WHEN EXISTS (
      SELECT 1 FROM ${schema.friend}
      WHERE (
        ${schema.friend.userIdA} = ${currentUserId} AND ${schema.friend.userIdB} = ${schema.profile.userId}
      ) OR (
        ${schema.friend.userIdA} = ${schema.profile.userId} AND ${schema.friend.userIdB} = ${currentUserId}
      )
    ) THEN 'FRIENDS'
    WHEN EXISTS (
      SELECT 1 FROM ${schema.friendRequest}
      WHERE ${schema.friendRequest.senderUserId} = ${currentUserId}
      AND ${schema.friendRequest.recipientUserId} = ${schema.profile.userId}
    ) THEN 'REQUESTED'
    ELSE 'NOT_FRIENDS'
  END`;
};

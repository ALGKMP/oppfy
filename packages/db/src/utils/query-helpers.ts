import { and, eq, isNull, or } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";

import type { Schema } from "../..";

/**
 * Only include profiles of users who have completed onboarding
 */
export function withOnboardingCompleted<T extends PgSelect>(
  qb: T,
  schema: Schema,
) {
  return qb
    .innerJoin(
      schema.userStatus,
      eq(schema.userStatus.userId, schema.profile.userId),
    )
    .where(eq(schema.userStatus.hasCompletedOnboarding, true));
}

/**
 * Exclude profiles that have blocked or been blocked by the given user
 */
export function withoutBlocked<T extends PgSelect>(
  qb: T,
  schema: Schema,
  userId: string,
) {
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
}

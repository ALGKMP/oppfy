import { and, eq } from "drizzle-orm";
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
      schema.userRelationship,
      and(
        eq(schema.userRelationship.userIdA, userId),
        eq(schema.userRelationship.userIdB, schema.profile.userId),
      ),
    )
    .where(eq(schema.userRelationship.blockStatus, false));
}

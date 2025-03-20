import { and, eq, or } from "drizzle-orm";

import { db, schema } from "@oppfy/db";
import type { followStatusEnum, friendStatusEnum } from "@oppfy/db";

export class UserRelationshipRepository {
  async createRelationship({
    userIdA,
    userIdB,
    friendshipStatus,
    followStatus,
    blocked,
  }: {
    userIdA: string;
    userIdB: string;
    friendshipStatus: (typeof friendStatusEnum.enumValues)[number];
    followStatus: (typeof followStatusEnum.enumValues)[number];
    blocked: boolean;
  }) {
    return await db.insert(schema.userRelationship).values({
      userIdA,
      userIdB,
      friendshipStatus,
      followStatus,
      blocked,
    });
  }

  async getRelationship({
    userIdA,
    userIdB,
  }: {
    userIdA: string;
    userIdB: string;
  }) {
    return await db.query.userRelationship.findFirst({
      where: or(
        and(
          eq(schema.userRelationship.userIdA, userIdA),
          eq(schema.userRelationship.userIdB, userIdB),
        ),
        and(
          eq(schema.userRelationship.userIdA, userIdB),
          eq(schema.userRelationship.userIdB, userIdA),
        ),
      ),
    });
  }

  async updateRelationship({
    userIdA,
    userIdB,
    friendshipStatus,
    followStatus,
    blocked,
  }: {
    userIdA: string;
    userIdB: string;
    friendshipStatus?: (typeof friendStatusEnum.enumValues)[number];
    followStatus?: (typeof followStatusEnum.enumValues)[number];
    blocked?: boolean;
  }) {
    const updateData: Partial<{
      friendshipStatus: (typeof friendStatusEnum.enumValues)[number];
      followStatus: (typeof followStatusEnum.enumValues)[number];
      blocked: boolean;
    }> = {};

    if (friendshipStatus !== undefined)
      updateData.friendshipStatus = friendshipStatus;
    if (followStatus !== undefined) updateData.followStatus = followStatus;
    if (blocked !== undefined) updateData.blocked = blocked;

    return await db
      .update(schema.userRelationship)
      .set(updateData)
      .where(
        or(
          and(
            eq(schema.userRelationship.userIdA, userIdA),
            eq(schema.userRelationship.userIdB, userIdB),
          ),
          and(
            eq(schema.userRelationship.userIdA, userIdB),
            eq(schema.userRelationship.userIdB, userIdA),
          ),
        ),
      );
  }
}

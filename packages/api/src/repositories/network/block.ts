import { and, asc, eq, gt, or } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class BlockRepository {
  private db = db;

  @handleDatabaseErrors
  async getPaginatedBlockedUsers({
    forUserId,
    cursor = null,
    pageSize = 10,
  }: {
    forUserId: string;
    cursor?: { createdAt: Date; profileId: string } | null;
    pageSize?: number;
  }) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.name,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.block.createdAt,
        profileId: schema.profile.id,
      })
      .from(schema.user)
      .innerJoin(
        schema.block,
        eq(schema.user.id, schema.block.userWhoIsBlockedId),
      )
      .innerJoin(schema.profile, eq(schema.user.id, schema.profile.userId))
      .where(
        and(
          eq(schema.block.userWhoIsBlockingId, forUserId),
          cursor
            ? or(
                gt(schema.block.createdAt, cursor.createdAt),
                and(
                  eq(schema.block.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(schema.block.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);
  }

  @handleDatabaseErrors
  async getBlockedUser({
    userId,
    blockedUserId,
  }: {
    userId: string;
    blockedUserId: string;
  }) {
    return await this.db.query.block.findFirst({
      where: and(
        eq(schema.block.userWhoIsBlockingId, userId),
        eq(schema.block.userWhoIsBlockedId, blockedUserId),
      ),
    });
  }

  @handleDatabaseErrors
  async blockUser({
    userId,
    blockedUserId,
  }: {
    userId: string;
    blockedUserId: string;
  }) {
    const blockedUser = await this.db
      .insert(schema.block)
      .values({
        userWhoIsBlockingId: userId,
        userWhoIsBlockedId: blockedUserId,
      });
    return blockedUser[0];
  }

  @handleDatabaseErrors
  async unblockUser({
    userId,
    blockedUserId,
  }: {
    userId: string;
    blockedUserId: string;
  }) {
    const result = await this.db
      .delete(schema.block)
      .where(
        and(
          eq(schema.block.userWhoIsBlockingId, userId),
          eq(schema.block.userWhoIsBlockedId, blockedUserId),
        ),
      );
    return result[0];
  }
}

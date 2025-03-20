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
      .innerJoin(schema.block, eq(schema.user.id, schema.block.blockedUserId))
      .innerJoin(schema.profile, eq(schema.user.id, schema.profile.userId))
      .where(
        and(
          eq(schema.block.blockedByUserId, forUserId),
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
      where: or(
        and(
          eq(schema.block.blockedByUserId, userId),
          eq(schema.block.blockedUserId, blockedUserId),
        ),
        and(
          eq(schema.block.blockedByUserId, blockedUserId),
          eq(schema.block.blockedUserId, userId),
        ),
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
    const blockedUser = await this.db.insert(schema.block).values({
      blockedByUserId: userId,
      blockedUserId: blockedUserId,
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
          eq(schema.block.blockedByUserId, userId),
          eq(schema.block.blockedUserId, blockedUserId),
        ),
      );
    return result[0];
  }
}

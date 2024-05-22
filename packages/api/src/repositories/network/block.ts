import { and, asc, eq, gt, or } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class BlockRepository {
  private db = db;

  @handleDatabaseErrors
  async getPaginatedBlockedUsers(
    forUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.block.createdAt,
        profileId: schema.profile.id,
      })
      .from(schema.user)
      .innerJoin(schema.block, eq(schema.user.id, schema.block.blockedUserId))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.block.userId, forUserId),
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
  async getBlockedUser(userId: string, blockedUserId: string) {
    return await this.db.query.block.findFirst({
      where: or(
        and(
          eq(schema.block.userId, userId),
          eq(schema.block.blockedUserId, blockedUserId),
        ),
        and(
          eq(schema.block.blockedUserId, userId),
          eq(schema.block.userId, blockedUserId),
        ),
      ),
    });
  }

  @handleDatabaseErrors
  async blockUser(userId: string, blockedUserId: string) {
    const blockedUser = await this.db.insert(schema.block).values({
      userId,
      blockedUserId,
    });
    return blockedUser[0];
  }

  @handleDatabaseErrors
  async unblockUser(userId: string, blockedUserId: string) {
    const result = await this.db
      .delete(schema.block)
      .where(
        and(
          eq(schema.block.userId, userId),
          eq(schema.block.blockedUserId, blockedUserId),
        ),
      );
    return result[0];
  }
}

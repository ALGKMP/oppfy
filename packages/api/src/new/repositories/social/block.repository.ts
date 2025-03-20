import { and, asc, eq, gt, or } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
import {
  BlockUserParams,
  GetBlockedUserParams,
  GetPaginatedBlockedUsersParams,
  GetPaginatedBlockedUsersResult,
  IBlockRepository,
  UnblockUserParams,
} from "../../interfaces/repositories/social/blockRepository.interface";

@injectable()
export class BlockRepository implements IBlockRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async getPaginatedBlockedUsers(
    params: GetPaginatedBlockedUsersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<GetPaginatedBlockedUsersResult[]> {
    const { forUserId, cursor = null, pageSize = 10 } = params;

    return await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        createdAt: this.schema.block.createdAt,
        profileId: this.schema.profile.id,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.block,
        eq(this.schema.user.id, this.schema.block.blockedUserId),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.block.blockedByUserId, forUserId),
          cursor
            ? or(
                gt(this.schema.block.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.block.createdAt, cursor.createdAt),
                  gt(this.schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.block.createdAt), asc(this.schema.profile.id))
      .limit(pageSize + 1);
  }

  async getBlockedUser(
    params: GetBlockedUserParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<{ id: string } | undefined> {
    const { userId, blockedUserId } = params;

    const result = await db
      .select({ id: this.schema.block.id })
      .from(this.schema.block)
      .where(
        and(
          eq(this.schema.block.blockedByUserId, userId),
          eq(this.schema.block.blockedUserId, blockedUserId),
        ),
      )
      .limit(1);

    return result[0];
  }

  async blockUser(
    params: BlockUserParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, blockedUserId } = params;

    await db.insert(this.schema.block).values({
      blockedByUserId: userId,
      blockedUserId: blockedUserId,
    });
  }

  async unblockUser(
    params: UnblockUserParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, blockedUserId } = params;

    await db
      .delete(this.schema.block)
      .where(
        and(
          eq(this.schema.block.blockedByUserId, userId),
          eq(this.schema.block.blockedUserId, blockedUserId),
        ),
      );
  }
}

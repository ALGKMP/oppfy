import { and, asc, eq, gt, or } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";

import { TYPES } from "../../container";
import type {
  BlockParams,
  GetBlockedUsersParams,
  IBlockRepository,
  SocialProfile,
} from "../../interfaces/repositories/social/block.repository.interface";
import type { Block, BlockWithProfile } from "../../models";

@injectable()
export class BlockRepository implements IBlockRepository {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.Schema)
    private readonly schema: Schema,
  ) {}

  async getBlock(
    params: BlockParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Block | undefined> {
    const { userId, blockedUserId } = params;

    const block = await db.query.block.findFirst({
      where: and(
        eq(this.schema.block.senderUserId, userId),
        eq(this.schema.block.recipientUserId, blockedUserId),
      ),
    });

    return block;
  }

  async blockUser(
    params: BlockParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, blockedUserId } = params;

    await db.insert(this.schema.block).values({
      senderUserId: userId,
      recipientUserId: blockedUserId,
    });
  }

  async unblockUser(
    params: BlockParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, blockedUserId } = params;

    await db
      .delete(this.schema.block)
      .where(
        and(
          eq(this.schema.block.senderUserId, userId),
          eq(this.schema.block.recipientUserId, blockedUserId),
        ),
      );
  }

  async paginateBlockedProfiles(
    params: GetBlockedUsersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<SocialProfile[]> {
    const { userId, cursor = null, limit = 10 } = params;

    const blockedUsers = await db
      .select({
        profile: this.schema.profile,
        blockedAt: this.schema.block.createdAt,
      })
      .from(this.schema.block)
      .innerJoin(
        this.schema.profile,
        eq(this.schema.profile.userId, this.schema.block.recipientUserId),
      )
      .where(
        and(
          eq(this.schema.block.senderUserId, userId),
          cursor
            ? or(
                gt(this.schema.block.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.block.createdAt, cursor.createdAt),
                  gt(this.schema.profile.userId, cursor.userId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(this.schema.block.createdAt),
        asc(this.schema.profile.userId),
      )
      .limit(limit);

    return blockedUsers.map(({ profile, blockedAt }) => ({
      ...profile,
      blockedAt,
    }));
  }
}

import { and, asc, eq, gt, or } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";
import { withOnboardingCompleted } from "@oppfy/db/utils/query-helpers";

import type {
  DirectionalUserIdsParams,
  PaginationParams,
} from "../../interfaces/types";
import type { Block, OnboardedProfile, Profile } from "../../models";
import { TYPES } from "../../symbols";

export interface PaginateBlockedUsersParams extends PaginationParams {
  userId: string;
}

@injectable()
export class BlockRepository {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.Schema)
    private readonly schema: Schema,
  ) {}

  async getBlock(
    { senderUserId, recipientUserId }: DirectionalUserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Block | undefined> {
    const block = await db.query.block.findFirst({
      where: and(
        eq(this.schema.block.senderUserId, senderUserId),
        eq(this.schema.block.recipientUserId, recipientUserId),
      ),
    });

    return block;
  }

  async blockUser(
    { senderUserId, recipientUserId }: DirectionalUserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db.insert(this.schema.block).values({
      senderUserId,
      recipientUserId,
    });
  }

  async unblockUser(
    { senderUserId, recipientUserId }: DirectionalUserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .delete(this.schema.block)
      .where(
        and(
          eq(this.schema.block.senderUserId, senderUserId),
          eq(this.schema.block.recipientUserId, recipientUserId),
        ),
      );
  }

  async paginateBlockedProfiles(
    { userId, cursor, pageSize = 10 }: PaginateBlockedUsersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<OnboardedProfile[]> {
    let query = db
      .select({
        profile: this.schema.profile,
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
                  gt(this.schema.profile.userId, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(this.schema.block.createdAt),
        asc(this.schema.profile.userId),
      )
      .limit(pageSize)
      .$dynamic();

    query = withOnboardingCompleted(query);

    const blockedUsers = await query;

    return blockedUsers.map(({ profile }) => profile as OnboardedProfile);
  }
}

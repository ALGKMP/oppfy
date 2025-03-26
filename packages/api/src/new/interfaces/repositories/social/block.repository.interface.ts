import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Profile } from "../../../models";

export interface GetBlockedUsersParams {
  userId: string;
  cursor?: { createdAt: Date; userId: string } | null;
  limit?: number;
}

export interface BlockParams {
  userId: string;
  blockedUserId: string;
}

export interface IBlockRepository {
  paginateBlockedProfiles(
    params: GetBlockedUsersParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;

  isBlocked(params: BlockParams, db?: DatabaseOrTransaction): Promise<boolean>;

  block(params: BlockParams, db?: DatabaseOrTransaction): Promise<void>;

  unblock(params: BlockParams, db?: DatabaseOrTransaction): Promise<void>;
}

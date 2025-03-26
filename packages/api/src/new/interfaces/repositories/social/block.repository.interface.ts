import type { DatabaseOrTransaction } from "@oppfy/db";

import type { BlockWithProfile } from "../../../models";

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
  ): Promise<BlockWithProfile[]>;

  isBlocked(params: BlockParams, db?: DatabaseOrTransaction): Promise<boolean>;

  blockUser(params: BlockParams, db?: DatabaseOrTransaction): Promise<void>;

  unblockUser(params: BlockParams, db?: DatabaseOrTransaction): Promise<void>;
}

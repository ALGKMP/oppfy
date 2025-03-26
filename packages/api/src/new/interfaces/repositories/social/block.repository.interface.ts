import type { DatabaseOrTransaction } from "@oppfy/db";

import type { BlockWithProfile } from "../../../models";

export interface GetBlockedUsersParams {
  userId: string;
  cursor?: { createdAt: Date; userId: string } | null;
  limit?: number;
}

export interface BlockUserParams {
  userId: string;
  blockedUserId: string;
}

export interface IBlockRepository {
  paginateBlockedUsers(
    params: GetBlockedUsersParams,
    db?: DatabaseOrTransaction,
  ): Promise<BlockWithProfile[]>;

  isUserBlocked(
    params: BlockUserParams,
    db?: DatabaseOrTransaction,
  ): Promise<boolean>;

  blockUser(params: BlockUserParams, db?: DatabaseOrTransaction): Promise<void>;

  unblockUser(
    params: BlockUserParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;
}

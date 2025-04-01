import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Block, Profile } from "../../../models";

export interface GetBlockedUsersParams {
  userId: string;
  cursor?: { createdAt: Date; userId: string } | null;
  limit?: number;
}

export interface BlockParams {
  userId: string;
  blockedUserId: string;
}

export interface SocialProfile extends Profile {
  blockedAt: Date;
}

export interface IBlockRepository {
  getBlock(
    params: BlockParams,
    db?: DatabaseOrTransaction,
  ): Promise<Block | undefined>;

  blockUser(params: BlockParams, db?: DatabaseOrTransaction): Promise<void>;

  unblockUser(params: BlockParams, db?: DatabaseOrTransaction): Promise<void>;

  paginateBlockedProfiles(
    params: GetBlockedUsersParams,
    db?: DatabaseOrTransaction,
  ): Promise<SocialProfile[]>;
}

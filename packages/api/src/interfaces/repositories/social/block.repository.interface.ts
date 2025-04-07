import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Block, Profile } from "../../../models";
import type { DirectionalUserIdsParams, PaginationParams } from "../../types";

export interface SocialProfile extends Profile {
  blockedAt: Date;
}

export interface PaginateBlockedUsersParams extends PaginationParams {
  userId: string;
}

export interface IBlockRepository {
  getBlock(
    params: DirectionalUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<Block | undefined>;

  blockUser(
    params: DirectionalUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  unblockUser(
    params: DirectionalUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  paginateBlockedProfiles(
    params: PaginateBlockedUsersParams,
    db?: DatabaseOrTransaction,
  ): Promise<SocialProfile[]>;
}

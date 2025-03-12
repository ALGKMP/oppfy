import type { Result } from "neverthrow";

import type { Transaction } from "@oppfy/db";

import type { BlockNotFoundError } from "../../../errors/social.errors";

export interface GetPaginatedBlockedUsersParams {
  forUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface GetPaginatedBlockedUsersResult {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  profileId: string;
}

export interface GetBlockedUserParams {
  userId: string;
  blockedUserId: string;
}

export interface BlockUserParams {
  userId: string;
  blockedUserId: string;
}

export interface UnblockUserParams {
  userId: string;
  blockedUserId: string;
}

export interface IBlockRepository {
  getPaginatedBlockedUsers(
    params: GetPaginatedBlockedUsersParams,
    tx?: Transaction,
  ): Promise<Result<GetPaginatedBlockedUsersResult[], never>>;

  getBlockedUser(
    params: GetBlockedUserParams,
    tx?: Transaction,
  ): Promise<Result<{ id: string } | undefined, never>>;

  blockUser(
    params: BlockUserParams,
    tx?: Transaction,
  ): Promise<Result<void, never>>;

  unblockUser(
    params: UnblockUserParams,
    tx?: Transaction,
  ): Promise<Result<void, BlockNotFoundError>>;
}

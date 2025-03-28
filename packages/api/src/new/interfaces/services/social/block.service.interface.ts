import type { Result } from "neverthrow";

import type { BlockError } from "../../../errors/social/block.error";

export interface BlockedUser {
  userId: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  blockedAt: Date;
}

export interface PaginationCursor {
  createdAt: Date;
  userId: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: PaginationCursor | null;
}

export interface BlockUserParams {
  blockerId: string;
  blockedId: string;
}

export interface UnblockUserParams {
  blockerId: string;
  blockedId: string;
}

export interface IsBlockedParams {
  blockerId: string;
  blockedId: string;
}

export interface GetBlockedUsersParams {
  userId: string;
  cursor?: PaginationCursor | null;
  pageSize?: number;
}

export interface IBlockService {
  blockUser(params: BlockUserParams): Promise<Result<void, BlockError>>;

  unblockUser(params: UnblockUserParams): Promise<Result<void, BlockError>>;

  paginateBlockedUsers(
    params: GetBlockedUsersParams,
  ): Promise<Result<PaginatedResponse<BlockedUser>, never>>;
}

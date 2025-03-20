import type { Result } from "neverthrow";

import type { BlockErrors } from "../../../errors/social/block.error";

export interface BlockedUser {
  userId: string;
  username: string;
  name: string;
  profilePictureUrl: string | null;
  createdAt: Date;
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
  blockUser(
    params: BlockUserParams,
  ): Promise<
    Result<void, BlockErrors.CannotBlockSelf | BlockErrors.AlreadyBlocked>
  >;

  unblockUser(
    params: UnblockUserParams,
  ): Promise<Result<void, BlockErrors.BlockNotFound>>;

  isBlocked(params: IsBlockedParams): Promise<Result<boolean, never>>;

  getBlockedUsers(
    params: GetBlockedUsersParams,
  ): Promise<Result<PaginatedResponse<BlockedUser>, never>>;
}

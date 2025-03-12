import type { Transaction } from "@oppfy/db";

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
    db?: Transaction,
  ): Promise<GetPaginatedBlockedUsersResult[]>;

  getBlockedUser(
    params: GetBlockedUserParams,
    db?: Transaction,
  ): Promise<{ id: string } | undefined>;

  blockUser(params: BlockUserParams, db?: Transaction): Promise<void>;

  unblockUser(params: UnblockUserParams, db?: Transaction): Promise<void>;
}

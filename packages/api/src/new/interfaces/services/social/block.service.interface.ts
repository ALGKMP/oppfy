import type { Result } from "neverthrow";

import type { BlockError } from "../../../errors/social/block.error";
import type { Profile } from "../../../models";
import type {
  DirectionalUserIdsParams,
  PaginatedResponse,
  PaginationParams,
} from "../../types";

export interface BlockedUser {
  userId: Profile["userId"];
  username: Profile["username"];
  name: Profile["name"];
  profilePictureUrl: Profile["profilePictureKey"];
  blockedAt: Date;
}

export interface GetBlockedUsersParams extends PaginationParams {
  userId: string;
}

export interface IBlockService {
  blockUser(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, BlockError>>;

  unblockUser(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, BlockError>>;

  paginateBlockedUsers(
    params: GetBlockedUsersParams,
  ): Promise<Result<PaginatedResponse<BlockedUser>, BlockError>>;
}

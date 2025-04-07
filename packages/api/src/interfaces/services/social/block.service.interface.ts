import type { Result } from "neverthrow";

import type * as BlockErrors from "../../../errors/social/block.error";
import type { Profile } from "../../../models";
import type {
  DirectionalUserIdsParams,
  PaginatedResponse,
  PaginationParams,
} from "../../types";

export type SocialProfile = Profile & {
  blockedAt: Date;
};

export interface GetBlockedUsersParams extends PaginationParams {
  userId: string;
}

export interface IBlockService {
  blockUser(
    params: DirectionalUserIdsParams,
  ): Promise<
    Result<void, BlockErrors.CannotBlockSelf | BlockErrors.AlreadyBlocked>
  >;

  unblockUser(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, BlockErrors.BlockNotFound>>;

  paginateBlockedUsers(
    params: GetBlockedUsersParams,
  ): Promise<Result<PaginatedResponse<SocialProfile>, never>>;
}

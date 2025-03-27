import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { cloudfront } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { BlockErrors } from "../../errors/social/block.error";
import type { IBlockRepository } from "../../interfaces/repositories/social/block.repository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friend.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  BlockedUser,
  BlockUserParams,
  GetBlockedUsersParams,
  IBlockService,
  IsBlockedParams,
  PaginatedResponse,
  UnblockUserParams,
} from "../../interfaces/services/social/block.service.interface";
import type { Profile } from "../../models";

@injectable()
export class BlockService implements IBlockService {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.BlockRepository)
    private readonly blockRepository: IBlockRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: IFriendRepository,
  ) {}

  async blockUser({
    blockerId,
    blockedId,
  }: BlockUserParams): Promise<
    Result<void, BlockErrors.CannotBlockSelf | BlockErrors.AlreadyBlocked>
  > {
    if (blockerId === blockedId) {
      return err(new BlockErrors.CannotBlockSelf(blockerId));
    }

    await this.db.transaction(async (tx) => {
      const isBlocked = await this.blockRepository.isBlocked(
        { userId: blockerId, blockedUserId: blockedId },
        tx,
      );
      if (isBlocked) {
        throw new BlockErrors.AlreadyBlocked(blockerId, blockedId);
      }

      // Check if users are friends and remove friendship if so
      const areFriends = await this.friendRepository.isFriends(
        { userIdA: blockerId, userIdB: blockedId },
        tx,
      );
      if (areFriends) {
        await this.friendRepository.removeFriend(
          { userIdA: blockerId, userIdB: blockedId },
          tx,
        );
      }

      await this.blockRepository.blockUser(
        { userId: blockerId, blockedUserId: blockedId },
        tx,
      );
    });

    return ok();
  }

  async unblockUser({
    blockerId,
    blockedId,
  }: UnblockUserParams): Promise<Result<void, BlockErrors.BlockNotFound>> {
    await this.db.transaction(async (tx) => {
      const isBlocked = await this.blockRepository.isBlocked(
        { userId: blockerId, blockedUserId: blockedId },
        tx,
      );
      if (!isBlocked) {
        throw new BlockErrors.BlockNotFound(blockerId, blockedId);
      }

      await this.blockRepository.unblockUser(
        { userId: blockerId, blockedUserId: blockedId },
        tx,
      );
    });

    return ok();
  }

  async isBlocked({
    blockerId,
    blockedId,
  }: IsBlockedParams): Promise<Result<boolean, never>> {
    const isBlocked = await this.blockRepository.isBlocked({
      userId: blockerId,
      blockedUserId: blockedId,
    });
    return ok(isBlocked);
  }

  async getBlockedUsers({
    userId,
    cursor,
    pageSize = 10,
  }: GetBlockedUsersParams): Promise<
    Result<PaginatedResponse<BlockedUser>, never>
  > {
    const rawBlockedData = await this.blockRepository.paginateBlockedProfiles({
      userId,
      cursor: cursor,
      limit: pageSize + 1,
    });

    const hydratedBlockedUsers = rawBlockedData.map(({ profile, block }) =>
      this.hydrateBlockedUser(profile, block.createdAt),
    );
    const lastUser = hydratedBlockedUsers[pageSize - 1];

    return ok({
      items: hydratedBlockedUsers.slice(0, pageSize),
      nextCursor:
        rawBlockedData.length > pageSize && lastUser
          ? {
              userId: lastUser.userId,
              createdAt: lastUser.createdAt,
            }
          : null,
    });
  }

  private hydrateBlockedUser(profile: Profile, createdAt: Date): BlockedUser {
    const hydratedProfile = cloudfront.hydrateProfile(profile);
    return {
      userId: profile.userId,
      username: profile.username ?? "",
      name: profile.name ?? "",
      profilePictureUrl: hydratedProfile.profilePictureUrl,
      createdAt,
    };
  }
}

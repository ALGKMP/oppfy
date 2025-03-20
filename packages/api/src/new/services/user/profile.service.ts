import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { ProfileErrors } from "../../errors/user/profile.error";
import type { IBlockRepository } from "../../interfaces/repositories/social/blockRepository.interface";
import type { IRelationshipRepository } from "../../interfaces/repositories/social/relationshipRepository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profileRepository.interface";
import type {
  GetProfileParams,
  GetStatsParams,
  IProfileService,
  SearchProfilesByUsernameParams,
  UpdateProfileParams,
} from "../../interfaces/services/user/profileService.interface";
import { Profile, UserStats } from "../../models";

@injectable()
export class ProfileService implements IProfileService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
    @inject(TYPES.BlockRepository)
    private readonly blockRepository: IBlockRepository,
  ) {}

  async profile(
    params: GetProfileParams,
  ): Promise<Result<Profile, ProfileErrors.ProfileNotFound>> {
    const { selfUserId, otherUserId } = params;

    // Check if blocked
    const [isBlocked, isBlockedBy] = await Promise.all([
      this.blockRepository.getBlockedUser({
        userId: selfUserId,
        blockedUserId: otherUserId,
      }),
      this.blockRepository.getBlockedUser({
        userId: otherUserId,
        blockedUserId: selfUserId,
      }),
    ]);

    if (isBlocked || isBlockedBy) {
      return err(new ProfileErrors.ProfileBlocked(otherUserId));
    }

    const profile = await this.profileRepository.getProfile({
      userId: otherUserId,
    });

    if (profile === undefined)
      return err(new ProfileErrors.ProfileNotFound(otherUserId));

    return ok(profile);
  }

  async stats(
    params: GetStatsParams,
  ): Promise<Result<UserStats, ProfileErrors.ProfileNotFound>> {
    const { userId } = params;

    const stats = await this.profileRepository.getStats({
      userId,
    });

    if (stats === undefined)
      return err(new ProfileErrors.StatsNotFound(userId));

    return ok(stats);
  }

  async updateProfile(
    params: UpdateProfileParams,
  ): Promise<Result<void, ProfileErrors.UsernameTaken>> {
    const { userId, newData } = params;

    if (newData.username) {
      const usernameTaken = await this.profileRepository.usernameTaken({
        username: newData.username,
      });

      if (usernameTaken) {
        return err(new ProfileErrors.UsernameTaken(newData.username));
      }
    }

    await this.profileRepository.updateProfile({
      userId,
      update: newData,
    });

    return ok();
  }

  async searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<Result<Profile[], never>> {
    const { username, selfUserId } = params;

    const profiles = await this.profileRepository.getProfilesByUsername({
      username,
      selfUserId,
      limit: 15,
    });

    return ok(profiles);
  }
}

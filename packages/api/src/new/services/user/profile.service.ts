import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { ProfileErrors } from "../../errors/user/profile.error";
import type { IBlockRepository } from "../../interfaces/repositories/social/blockRepository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profileRepository.interface";
import type {
  GetProfileByUsernameParams,
  GetProfileParams,
  GetUploadProfilePictureUrlParams,
  IProfileService,
  ProfileByUsernameResult,
  ProfileResult,
  SearchProfilesByUsernameParams,
  UpdateProfileParams,
} from "../../interfaces/services/user/profileService.interface";

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

  async getUploadProfilePictureUrl(
    params: GetUploadProfilePictureUrlParams,
  ): Promise<string> {
    // TODO: Implement S3 presigned URL generation
    return "https://example.com/upload";
  }

  async updateProfile(params: UpdateProfileParams): Promise<void> {
    const { userId, newData } = params;

    // Check if username is being updated and if it already exists
    if (newData.username) {
      const exists = await this.profileRepository.usernameTaken(
        newData.username,
      );
      if (exists) {
        throw new Error(`Username "${newData.username}" already exists`);
      }
    }

    await this.profileRepository.updateProfile({
      userId,
      update: newData,
    });
  }

  async getProfileByUsername(
    params: GetProfileByUsernameParams,
  ): Promise<ProfileByUsernameResult> {
    const { username } = params;

    const profile = await this.profileRepository.getProfileByUsername({
      username,
    });

    if (!profile) {
      throw new Error(`Profile not found with username "${username}"`);
    }

    return {
      userId: profile.userId,
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      profilePictureUrl: profile.profilePictureKey,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async getProfile(params: GetProfileParams): Promise<ProfileResult> {
    const { selfUserId, otherUserId } = params;

    const profile = await this.profileRepository.getProfile({
      userId: otherUserId,
    });

    if (!profile) {
      throw new Error(`Profile not found for user "${otherUserId}"`);
    }

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
      throw new Error("Cannot view profile of blocked user");
    }

    return {
      userId: profile.userId,
      privacy: profile.privacy,
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      profilePictureUrl: profile.profilePictureKey,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<ProfileByUsernameResult[]> {
    const { username, selfUserId } = params;

    const profiles = await this.profileRepository.getProfilesByUsername({
      username,
      selfUserId,
      limit: 15,
    });

    return profiles.map((profile) => ({
      userId: profile.userId,
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      profilePictureUrl: profile.profilePictureKey,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));
  }
}

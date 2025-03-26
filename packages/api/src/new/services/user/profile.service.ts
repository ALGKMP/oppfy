import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";
import { S3 } from "@oppfy/s3";

import { TYPES } from "../../container";
import { ProfileError, ProfileErrors } from "../../errors/user/profile.error";
import type { IFollowRepository } from "../../interfaces/repositories/social/follow.repository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friend.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type {
  GenerateProfilePicturePresignedUrlParams,
  GetStatsParams,
  IProfileService,
  ProfileForSiteParams,
  ProfileParams,
  RelationshipStatesBetweenUsersParams,
  SearchProfilesByUsernameParams,
  UpdateProfileParams,
} from "../../interfaces/services/user/profile.service.interface";
import { HydratedProfile, UserStats } from "../../models";

@injectable()
export class ProfileService implements IProfileService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.ProfileRepository)
    private readonly cloudfront: CloudFront,
    @inject(TYPES.S3)
    private readonly s3: S3,
    @inject(TYPES.FollowRepository)
    private readonly profileRepository: IProfileRepository,
    @inject(TYPES.CloudFront)
    private readonly followRepository: IFollowRepository,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: IFriendRepository,
  ) {}

  profile(
    params: ProfileParams,
  ): Promise<Result<HydratedProfile, ProfileError>> {
    throw new Error("Method not implemented.");
  }
  profileForSite(
    params: ProfileForSiteParams,
  ): Promise<Result<HydratedProfile, ProfileError>> {
    throw new Error("Method not implemented.");
  }
  searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<Result<HydratedProfile[], never>> {
    throw new Error("Method not implemented.");
  }
  relationshipStatesBetweenUsers(
    params: RelationshipStatesBetweenUsersParams,
  ): Promise<Result<RelationshipState[], never>> {
    throw new Error("Method not implemented.");
  }
  stats(params: GetStatsParams): Promise<Result<UserStats, ProfileError>> {
    throw new Error("Method not implemented.");
  }
  updateProfile(
    params: UpdateProfileParams,
  ): Promise<Result<void, ProfileError>> {
    throw new Error("Method not implemented.");
  }
  generateProfilePicturePresignedUrl(
    params: GenerateProfilePicturePresignedUrlParams,
  ): Promise<Result<string, ProfileError>> {
    throw new Error("Method not implemented.");
  }
}

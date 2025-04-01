import type { Result } from "neverthrow";

import type { ProfileError } from "../../../errors/user/profile.error";
import type {
  HydratedProfile,
  ProfileInsert,
  UserStats,
} from "../../../models";
import type {
  FollowStatus,
  FriendStatus,
  SelfOtherUserIdsParams,
  UserIdParam,
} from "../../types";

export interface RelationshipState {
  follow: FollowStatus;
  friend: FriendStatus;
}

export interface ProfileForSiteParams {
  username: string;
}

export interface SearchProfilesByUsernameParams extends UserIdParam {
  username: string;
}

export interface UpdateProfileParams extends UserIdParam {
  update: Partial<ProfileInsert>;
}

export interface GenerateProfilePicturePresignedUrlParams extends UserIdParam {
  contentLength: number;
}

export interface IProfileService {
  profile(
    params: SelfOtherUserIdsParams,
  ): Promise<Result<HydratedProfile, ProfileError>>;

  profileForSite(
    params: ProfileForSiteParams,
  ): Promise<Result<HydratedProfile, ProfileError>>;

  searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<Result<HydratedProfile[], ProfileError>>;

  relationshipStatesBetweenUsers(
    params: SelfOtherUserIdsParams,
  ): Promise<Result<RelationshipState[], ProfileError>>;

  stats(
    params: SelfOtherUserIdsParams,
  ): Promise<Result<UserStats, ProfileError>>;

  updateProfile(
    params: UpdateProfileParams,
  ): Promise<Result<void, ProfileError>>;

  generateProfilePicturePresignedUrl(
    params: GenerateProfilePicturePresignedUrlParams,
  ): Promise<Result<string, ProfileError>>;
}

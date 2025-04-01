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
  UsernameParam,
} from "../../types";

export interface RelationshipState {
  follow: FollowStatus;
  friend: FriendStatus;
}

export interface SearchProfilesByUsernameParams {
  userId: string;
  username: string;
}

export interface UpdateProfileParams {
  userId: string;
  update: Partial<ProfileInsert>;
}

export interface GenerateProfilePicturePresignedUrlParams {
  userId: string;
  contentLength: number;
}

export interface IProfileService {
  profile(
    params: SelfOtherUserIdsParams,
  ): Promise<Result<HydratedProfile, ProfileError>>;

  profileForSite(
    params: UsernameParam,
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

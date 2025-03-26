import type { Result } from "neverthrow";

import type { ProfileError } from "../../../errors/user/profile.error";
import type {
  HydratedProfile,
  ProfileInsert,
  UserStats,
} from "../../../models";

export interface ProfileParams {
  selfUserId: string;
  otherUserId: string;
}

export interface ProfileForSiteParams {
  username: string;
}

export interface SearchProfilesByUsernameParams {
  username: string;
  selfUserId: string;
}

export interface RelationshipStatesBetweenUsersParams {
  currentUserId: string;
  otherUserId: string;
}

export interface GetStatsParams {
  userId: string;
}

export interface UpdateProfileParams {
  userId: string;
  update: Partial<ProfileInsert>;
}

export interface GenerateProfilePicturePresignedUrlParams {
  userId: string;
  contentLength: number;
}

type FollowRelationshipState =
  | "NOT_FOLLOWING"
  | "FOLLOW_REQUEST_SENT"
  | "FOLLOWING";

type FriendRelationshipState =
  | "NOT_FRIENDS"
  | "FRIEND_REQUEST_SENT"
  | "FRIENDS";

interface RelationshipState {
  follow: FollowRelationshipState;
  friend: FriendRelationshipState;
}

export interface IProfileService {
  profile(
    params: ProfileParams,
  ): Promise<Result<HydratedProfile, ProfileError>>;

  profileForSite(
    params: ProfileForSiteParams,
  ): Promise<Result<HydratedProfile, ProfileError>>;

  searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<Result<HydratedProfile[], never>>;

  relationshipStatesBetweenUsers(
    params: RelationshipStatesBetweenUsersParams,
  ): Promise<Result<RelationshipState[], never>>;

  stats(params: GetStatsParams): Promise<Result<UserStats, ProfileError>>;

  updateProfile(
    params: UpdateProfileParams,
  ): Promise<Result<void, ProfileError>>;

  generateProfilePicturePresignedUrl(
    params: GenerateProfilePicturePresignedUrlParams,
  ): Promise<Result<string, ProfileError>>;
}

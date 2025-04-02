import type { Result } from "neverthrow";

import type * as ProfileErrors from "../../../errors/user/profile.error";
import type {
  HydratedProfile,
  Profile,
  ProfileInsert,
  UserStats,
} from "../../../models";
import type {
  FollowStatus,
  FriendStatus,
  SelfOtherUserIdsParams,
  UserIdParam,
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
    params: SelfOtherUserIdsParams<"optional">,
  ): Promise<
    Result<
      HydratedProfile,
      | ProfileErrors.ProfileBlocked
      | ProfileErrors.ProfileNotFound
      | ProfileErrors.ProfilePrivate
    >
  >;

  profileForSite(
    params: UsernameParam,
  ): Promise<Result<HydratedProfile, ProfileErrors.ProfileNotFound>>;

  searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<Result<HydratedProfile[], never>>;

  relationshipStatesBetweenUsers(
    params: SelfOtherUserIdsParams<"optional">,
  ): Promise<
    Result<
      RelationshipState[],
      | ProfileErrors.ProfileBlocked
      | ProfileErrors.CannotCheckRelationshipWithSelf
    >
  >;

  stats(
    params: SelfOtherUserIdsParams<"optional">,
  ): Promise<
    Result<
      UserStats,
      ProfileErrors.ProfileBlocked | ProfileErrors.StatsNotFound
    >
  >;

  privacy(
    params: UserIdParam,
  ): Promise<Result<Profile["privacy"], ProfileErrors.ProfileNotFound>>;

  updateProfile(params: UpdateProfileParams): Promise<Result<void, never>>;

  generateProfilePicturePresignedUrl(
    params: GenerateProfilePicturePresignedUrlParams,
  ): Promise<Result<string, never>>;
}

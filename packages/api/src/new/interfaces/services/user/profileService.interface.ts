import type { Result } from "neverthrow";

import type { ProfileErrors } from "../../../errors/user/profile.error";
import type { Profile } from "../../../models";

export interface GetProfileParams {
  selfUserId: string;
  otherUserId: string;
}

export interface SearchProfilesByUsernameParams {
  username: string;
  selfUserId: string;
}

export interface GetStatsParams {
  userId: string;
}

export interface UpdateProfileParams {
  userId: string;
  newData: Partial<{
    name: string;
    username: string;
    bio: string;
    dateOfBirth: Date;
  }>;
}

export interface ProfileStats {
  followers: number;
  following: number;
  friends: number;
  posts: number;
}

export interface IProfileService {
  profile(
    params: GetProfileParams,
  ): Promise<Result<Profile, ProfileErrors.ProfileNotFound>>;

  searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<Result<Profile[], never>>;

  stats(
    params: GetStatsParams,
  ): Promise<Result<ProfileStats, ProfileErrors.ProfileNotFound>>;

  updateProfile(
    params: UpdateProfileParams,
  ): Promise<Result<void, ProfileErrors.UsernameTaken>>;
}

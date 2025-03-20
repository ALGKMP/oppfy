import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Profile, ProfileInsert, ProfileStats } from "../../../models";

export interface UserIdParams {
  userId: string;
}

export interface UsernameParams {
  username: string;
}

export interface GetStatsParams {
  userId: string;
}

export interface UpdateProfileParams {
  userId: string;
  update: Partial<ProfileInsert>;
}

export interface ProfilesByUsernameParams {
  username: string;
  selfUserId: string;
  limit?: number;
}

export interface IProfileRepository {
  getProfile(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile | undefined>;

  getProfilesByUsername(
    params: ProfilesByUsernameParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;

  getStats(
    params: GetStatsParams,
    db?: DatabaseOrTransaction,
  ): Promise<ProfileStats>;

  usernameTaken(
    params: UsernameParams,
    db?: DatabaseOrTransaction,
  ): Promise<boolean>;

  updateProfile(
    params: UpdateProfileParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;
}

import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Profile, ProfileInsert, UserStats } from "../../../models";
import type { UserIdParam, UsernameParam } from "../../types";

export interface ProfilesByIdsParams {
  userIds: string[];
}

export interface UpdateProfileParams {
  userId: string;
  update: Partial<ProfileInsert>;
}

export interface ProfilesByUsernameParams {
  userId: string;
  username: string;
  limit?: number;
}

export interface IProfileRepository {
  getProfile(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<Profile | undefined>;

  getProfileByUsername(
    params: UsernameParam,
    db?: DatabaseOrTransaction,
  ): Promise<Profile | undefined>;

  getProfilesByIds(
    params: ProfilesByIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;

  getProfilesByUsername(
    params: ProfilesByUsernameParams,
    db?: DatabaseOrTransaction,
  ): Promise<Profile[]>;

  getPrivacy(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<Profile["privacy"] | undefined>;

  getStats(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<UserStats | undefined>;

  usernameTaken(
    params: UsernameParam,
    db?: DatabaseOrTransaction,
  ): Promise<boolean>;

  updateProfile(
    params: UpdateProfileParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;
}

import type { Schema, Transaction } from "@oppfy/db";

import type { Profile, UserWithProfile } from "../../../models";

import { ProfileError } from "../../../errors/user/profile.error";
import { Result } from "neverthrow";


export interface GetProfileParams {
  profileId: string;
}

export interface GetUserProfileParams {
  userId: string;
}

export interface GetUserFullProfileParams {
  userId: string;
}

export interface GetProfileByUsernameParams {
  username: string;
}

export interface UpdateProfileParams {
  profileId: string;
  update: Partial<Schema["profile"]["$inferInsert"]>;
}

export interface UpdateProfilePictureParams {
  profileId: string;
  newKey: string;
}

export interface UsernameExistsParams {
  username: string;
}

export interface GetBatchProfilesParams {
  userIds: string[];
}

export interface DeleteProfileParams {
  profileId: string;
}

export interface ProfilesByUsernameParams {
  username: string;
  currentUserId: string;
  limit?: number;
}

export interface ProfileResult {
  userId: string;
  username: string;
  name: string | null;
  bio?: string | null;
  profilePictureKey: string | null;
}

export interface BatchProfileResult {
  userId: string;
  profileId: string;
  privacy: string;
  username: string;
  name: string | null;
  profilePictureKey: string | null;
}

export interface IProfileRepository {
  getProfile(
    params: GetProfileParams,
    tx?: Transaction,
  ): Promise<Result<Profile, ProfileError.ProfileNotFound>>;

  getUserProfile(
    params: GetUserProfileParams,
    tx?: Transaction,
  ): Promise<UserWithProfile | undefined>;

  getUserFullProfile(
    params: GetUserFullProfileParams,
    tx?: Transaction,
  ): Promise<UserWithProfile | undefined>;

  getProfileByUsername(
    params: GetProfileByUsernameParams,
    tx?: Transaction,
  ): Promise<Profile | undefined>;

  updateProfile(params: UpdateProfileParams, tx?: Transaction): Promise<void>;

  updateProfilePicture(
    params: UpdateProfilePictureParams,
    tx?: Transaction,
  ): Promise<void>;

  usernameExists(
    params: UsernameExistsParams,
    tx?: Transaction,
  ): Promise<boolean>;

  getBatchProfiles(
    params: GetBatchProfilesParams,
    tx?: Transaction,
  ): Promise<BatchProfileResult[]>;

  deleteProfile(params: DeleteProfileParams, tx?: Transaction): Promise<void>;

  profilesByUsername(
    params: ProfilesByUsernameParams,
    tx?: Transaction,
  ): Promise<ProfileResult[]>;
}

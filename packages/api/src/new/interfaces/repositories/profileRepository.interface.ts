import { Transaction } from "@oppfy/db";
import type { Schema } from "@oppfy/db";

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
  ): Promise<any>;

  getUserProfile(
    params: GetUserProfileParams,
    tx?: Transaction,
  ): Promise<any>;

  getUserFullProfile(
    params: GetUserFullProfileParams,
    tx?: Transaction,
  ): Promise<any>;

  getProfileByUsername(
    params: GetProfileByUsernameParams,
    tx?: Transaction,
  ): Promise<any>;

  updateProfile(
    params: UpdateProfileParams,
    tx?: Transaction,
  ): Promise<void>;

  updateProfilePicture(
    params: UpdateProfilePictureParams,
    tx?: Transaction,
  ): Promise<void>;

  usernameExists(
    params: UsernameExistsParams,
    tx?: Transaction,
  ): Promise<any>;

  getBatchProfiles(
    params: GetBatchProfilesParams,
    tx?: Transaction,
  ): Promise<BatchProfileResult[]>;

  deleteProfile(
    params: DeleteProfileParams,
    tx?: Transaction,
  ): Promise<void>;

  profilesByUsername(
    params: ProfilesByUsernameParams,
    tx?: Transaction,
  ): Promise<ProfileResult[]>;
} 
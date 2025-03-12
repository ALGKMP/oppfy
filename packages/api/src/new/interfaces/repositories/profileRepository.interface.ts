import type { Schema, Transaction } from "@oppfy/db";

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
  getProfile(params: GetProfileParams, db?: Transaction): Promise<any>;

  getUserProfile(params: GetUserProfileParams, db?: Transaction): Promise<any>;

  getUserFullProfile(
    params: GetUserFullProfileParams,
    db?: Transaction,
  ): Promise<any>;

  getProfileByUsername(
    params: GetProfileByUsernameParams,
    db?: Transaction,
  ): Promise<any>;

  updateProfile(params: UpdateProfileParams, db?: Transaction): Promise<void>;

  updateProfilePicture(
    params: UpdateProfilePictureParams,
    db?: Transaction,
  ): Promise<void>;

  usernameExists(params: UsernameExistsParams, db?: Transaction): Promise<any>;

  getBatchProfiles(
    params: GetBatchProfilesParams,
    db?: Transaction,
  ): Promise<BatchProfileResult[]>;

  deleteProfile(params: DeleteProfileParams, db?: Transaction): Promise<void>;

  profilesByUsername(
    params: ProfilesByUsernameParams,
    db?: Transaction,
  ): Promise<ProfileResult[]>;
}

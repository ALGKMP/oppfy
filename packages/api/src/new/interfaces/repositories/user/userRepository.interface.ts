import type { InferInsertModel, Transaction } from "@oppfy/db";

import type { User, UserStatus, UserWithProfile } from "../../../models";

export type PrivacySettings = NonNullable<
  InferInsertModel<typeof import("@oppfy/db").schema.user>["privacySetting"]
>;

export interface CreateUserParams {
  userId: string;
  phoneNumber: string;
  username: string;
  isOnApp: boolean;
  name?: string;
}

export interface GetUserParams {
  userId: string;
}

export interface GetUserWithProfileParams {
  userId: string;
}

export interface GetUserStatusParams {
  userId: string;
}

export interface GetUserByPhoneNumberParams {
  phoneNumber: string;
}

export interface DeleteUserParams {
  userId: string;
}

export interface UpdatePrivacyParams {
  userId: string;
  newPrivacySetting: PrivacySettings;
}

export interface GetRandomActiveProfilesForRecsParams {
  limit: number;
}

export interface ExistingPhoneNumbersParams {
  phoneNumbers: string[];
}

export interface UpdateStatsOnUserDeleteParams {
  userId: string;
}

export interface UpdateUserOnAppStatusParams {
  userId: string;
  isOnApp: boolean;
}

export interface UpdateUserTutorialCompleteParams {
  userId: string;
  hasCompletedTutorial: boolean;
}

export interface UpdateUserOnboardingCompleteParams {
  userId: string;
  hasCompletedOnboarding: boolean;
}

export interface IUserRepository {
  createUser(params: CreateUserParams, tx?: Transaction): Promise<void>;

  getUser(params: GetUserParams, tx?: Transaction): Promise<User | undefined>;

  getUserWithProfile(
    params: GetUserWithProfileParams,
    tx?: Transaction,
  ): Promise<UserWithProfile | undefined>;

  getUserStatus(
    params: GetUserStatusParams,
    tx?: Transaction,
  ): Promise<UserStatus | undefined>;

  getUserByPhoneNumber(
    params: GetUserByPhoneNumberParams,
    tx?: Transaction,
  ): Promise<User | undefined>;

  deleteUser(params: DeleteUserParams, tx?: Transaction): Promise<void>;

  updatePrivacy(params: UpdatePrivacyParams, tx?: Transaction): Promise<void>;

  getRandomActiveProfilesForRecs(
    params: GetRandomActiveProfilesForRecsParams,
    tx?: Transaction,
  ): Promise<{ userId: string }[]>;

  existingPhoneNumbers(
    params: ExistingPhoneNumbersParams,
    tx?: Transaction,
  ): Promise<string[]>;

  updateStatsOnUserDelete(
    params: UpdateStatsOnUserDeleteParams,
    tx?: Transaction,
  ): Promise<void>;

  updateUserOnAppStatus(
    params: UpdateUserOnAppStatusParams,
    tx?: Transaction,
  ): Promise<void>;

  updateUserTutorialComplete(
    params: UpdateUserTutorialCompleteParams,
    tx?: Transaction,
  ): Promise<void>;

  updateUserOnboardingComplete(
    params: UpdateUserOnboardingCompleteParams,
    tx?: Transaction,
  ): Promise<void>;
}

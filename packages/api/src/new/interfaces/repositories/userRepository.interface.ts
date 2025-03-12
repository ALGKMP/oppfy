import type { InferInsertModel, Transaction } from "@oppfy/db";

import type { User, UserStatus, UserWithProfile } from "../../models";

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
  createUser(params: CreateUserParams, db?: Transaction): Promise<void>;

  getUser(params: GetUserParams, db?: Transaction): Promise<User | undefined>;

  getUserWithProfile(
    params: GetUserWithProfileParams,
    db?: Transaction,
  ): Promise<UserWithProfile | undefined>;

  getUserStatus(
    params: GetUserStatusParams,
    db?: Transaction,
  ): Promise<UserStatus | undefined>;

  getUserByPhoneNumber(
    params: GetUserByPhoneNumberParams,
    db?: Transaction,
  ): Promise<User | undefined>;

  deleteUser(params: DeleteUserParams, db?: Transaction): Promise<void>;

  updatePrivacy(params: UpdatePrivacyParams, db?: Transaction): Promise<void>;

  getRandomActiveProfilesForRecs(
    params: GetRandomActiveProfilesForRecsParams,
    db?: Transaction,
  ): Promise<{ userId: string }[]>;

  existingPhoneNumbers(
    params: ExistingPhoneNumbersParams,
    db?: Transaction,
  ): Promise<string[]>;

  updateStatsOnUserDelete(
    params: UpdateStatsOnUserDeleteParams,
    db?: Transaction,
  ): Promise<void>;

  updateUserOnAppStatus(
    params: UpdateUserOnAppStatusParams,
    db?: Transaction,
  ): Promise<void>;

  updateUserTutorialComplete(
    params: UpdateUserTutorialCompleteParams,
    db?: Transaction,
  ): Promise<void>;

  updateUserOnboardingComplete(
    params: UpdateUserOnboardingCompleteParams,
    db?: Transaction,
  ): Promise<void>;
}

import type {
  DatabaseOrTransaction,
  InferInsertModel,
  Transaction,
} from "@oppfy/db";

import type {
  User,
  UserStatus,
  UserWithNotificationSettings,
  UserWithProfile,
} from "../../../models";

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

export interface GetUserWithNotificationSettingsParams {
  userId: string;
}

export interface IUserRepository {
  createUser(params: CreateUserParams, tx: Transaction): Promise<void>;

  getUser(
    params: GetUserParams,
    db?: DatabaseOrTransaction,
  ): Promise<User | undefined>;

  getUserWithProfile(
    params: GetUserWithProfileParams,
    db?: DatabaseOrTransaction,
  ): Promise<UserWithProfile | undefined>;

  getUserWithNotificationSettings(
    params: GetUserWithNotificationSettingsParams,
    db?: DatabaseOrTransaction,
  ): Promise<UserWithNotificationSettings | undefined>;

  getUserStatus(
    params: GetUserStatusParams,
    db?: DatabaseOrTransaction,
  ): Promise<UserStatus | undefined>;

  getUserByPhoneNumber(
    params: GetUserByPhoneNumberParams,
    db?: DatabaseOrTransaction,
  ): Promise<User | undefined>;

  deleteUser(
    params: DeleteUserParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  updatePrivacy(
    params: UpdatePrivacyParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  getRandomActiveProfilesForRecs(
    params: GetRandomActiveProfilesForRecsParams,
    db?: DatabaseOrTransaction,
  ): Promise<{ userId: string }[]>;

  existingPhoneNumbers(
    params: ExistingPhoneNumbersParams,
    db?: DatabaseOrTransaction,
  ): Promise<string[]>;

  updateStatsOnUserDelete(
    params: UpdateStatsOnUserDeleteParams,
    tx: Transaction,
  ): Promise<void>;

  updateUserOnAppStatus(
    params: UpdateUserOnAppStatusParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  updateUserTutorialComplete(
    params: UpdateUserTutorialCompleteParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  updateUserOnboardingComplete(
    params: UpdateUserOnboardingCompleteParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;
}

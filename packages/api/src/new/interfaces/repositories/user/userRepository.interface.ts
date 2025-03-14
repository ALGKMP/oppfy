import type { Result } from "neverthrow";

import type { InferInsertModel, Transaction } from "@oppfy/db";

import type {
  PhoneNumberNotFoundError,
  UserCreationError,
  UserNotFoundError,
  UserProfileNotFoundError,
  UserStatusNotFoundError,
} from "../../../errors/user.errors";
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
  createUser(
    params: CreateUserParams,
    tx?: Transaction,
  ): Promise<Result<void, UserCreationError>>;

  getUser(
    params: GetUserParams,
    tx?: Transaction,
  ): Promise<Result<User, UserNotFoundError>>;

  getUserWithProfile(
    params: GetUserWithProfileParams,
    tx?: Transaction,
  ): Promise<
    Result<UserWithProfile, UserProfileNotFoundError>
  >;

  getUserStatus(
    params: GetUserStatusParams,
    tx?: Transaction,
  ): Promise<Result<UserStatus, UserStatusNotFoundError>>;

  getUserByPhoneNumber(
    params: GetUserByPhoneNumberParams,
    tx?: Transaction,
  ): Promise<Result<User, PhoneNumberNotFoundError>>;

  deleteUser(
    params: DeleteUserParams,
    tx?: Transaction,
  ): Promise<Result<void, UserNotFoundError>>;

  updatePrivacy(
    params: UpdatePrivacyParams,
    tx?: Transaction,
  ): Promise<Result<void, UserNotFoundError>>;

  getRandomActiveProfilesForRecs(
    params: GetRandomActiveProfilesForRecsParams,
    tx?: Transaction,
  ): Promise<Result<{ userId: string }[], never>>;

  existingPhoneNumbers(
    params: ExistingPhoneNumbersParams,
    tx?: Transaction,
  ): Promise<Result<string[], never>>;

  updateStatsOnUserDelete(
    params: UpdateStatsOnUserDeleteParams,
    tx?: Transaction,
  ): Promise<Result<void, UserNotFoundError>>;

  updateUserOnAppStatus(
    params: UpdateUserOnAppStatusParams,
    tx?: Transaction,
  ): Promise<Result<void, UserNotFoundError>>;

  updateUserTutorialComplete(
    params: UpdateUserTutorialCompleteParams,
    tx?: Transaction,
  ): Promise<Result<void, UserNotFoundError>>;

  updateUserOnboardingComplete(
    params: UpdateUserOnboardingCompleteParams,
    tx?: Transaction,
  ): Promise<Result<void, UserNotFoundError>>;
}

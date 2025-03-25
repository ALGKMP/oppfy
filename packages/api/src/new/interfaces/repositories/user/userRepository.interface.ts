import type { DatabaseOrTransaction } from "@oppfy/db";

import type { Profile, User, UserStatus } from "../../../models";

export interface UserIdParams {
  userId: string;
}

export interface GetUserByPhoneNumberParams {
  phoneNumber: string;
}

export interface CreateUserOnAppParams {
  userId: string;
  phoneNumber: string;
  username: string;
}

export interface CreateUserNotOnAppParams extends CreateUserOnAppParams {
  name: string;
}

export interface UpdatePrivacyParams {
  userId: string;
  newPrivacySetting: Profile["privacy"];
}

export interface GetRandomActiveUserIdsParams {
  limit: number;
}

export interface ExistingPhoneNumbersParams {
  phoneNumbers: string[];
}

export interface IUserRepository {
  getUser(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<User | undefined>;

  getUserByPhoneNumber(
    params: GetUserByPhoneNumberParams,
    db?: DatabaseOrTransaction,
  ): Promise<User | undefined>;

  getRandomActiveUserIds(
    params: GetRandomActiveUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<{ userId: string }[]>;

  createUserOnApp(
    params: CreateUserOnAppParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  createUserNotOnApp(
    params: CreateUserNotOnAppParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteUser(params: UserIdParams, db?: DatabaseOrTransaction): Promise<void>;

  getUserStatus(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<UserStatus | undefined>;

  existingPhoneNumbers(
    params: ExistingPhoneNumbersParams,
    db?: DatabaseOrTransaction,
  ): Promise<string[]>;

  markUserAsOnApp(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  markUserAsTutorialComplete(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  markUserAsOnboardingComplete(
    params: UserIdParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;
}

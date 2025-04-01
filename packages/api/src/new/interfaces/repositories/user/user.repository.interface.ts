import type { DatabaseOrTransaction } from "@oppfy/db";

import type { User, UserStatus } from "../../../models";
import type { PhoneNumberParam, UserIdParam } from "../../types";

export interface CreateUserOnAppParams {
  userId: string;
  phoneNumber: string;
  username: string;
}

export interface CreateUserNotOnAppParams {
  userId: string;
  phoneNumber: string;
  name: string;
  username: string;
}

export interface GetRandomActiveUserIdsParams {
  limit: number;
}

export interface ExistingPhoneNumbersParams {
  phoneNumbers: string[];
}

export interface IUserRepository {
  getUser(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<User | undefined>;

  getUserByPhoneNumber(
    params: PhoneNumberParam,
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

  deleteUser(params: UserIdParam, db?: DatabaseOrTransaction): Promise<void>;

  getUserStatus(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<UserStatus | undefined>;

  existingPhoneNumbers(
    params: ExistingPhoneNumbersParams,
    db?: DatabaseOrTransaction,
  ): Promise<string[]>;

  markUserAsOnApp(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  markUserAsTutorialComplete(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  markUserAsOnboardingComplete(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<void>;
}

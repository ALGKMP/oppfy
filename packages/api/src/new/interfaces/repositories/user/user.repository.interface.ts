// interfaces/repositories/user/user.repository.interface.ts
import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";

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
  pageSize?: number;
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

  getUserStatus(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<UserStatus | undefined>;

  createUserOnApp(
    params: CreateUserOnAppParams,
    tx: Transaction,
  ): Promise<void>;

  createUserNotOnApp(
    params: CreateUserNotOnAppParams,
    tx: Transaction,
  ): Promise<void>;

  deleteUser(params: UserIdParam, db?: DatabaseOrTransaction): Promise<void>;

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

  getUserByPhoneNumberNoThrow(
    params: PhoneNumberParam,
    db?: DatabaseOrTransaction,
  ): Promise<User | undefined>;

  isUserOnApp(
    params: UserIdParam,
    db?: DatabaseOrTransaction,
  ): Promise<boolean>;

  updateUserOnAppStatus(
    params: { userId: string; isOnApp: boolean },
    db?: DatabaseOrTransaction,
  ): Promise<void>;
}
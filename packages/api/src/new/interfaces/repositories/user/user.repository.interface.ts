// interfaces/repositories/user/user.repository.interface.ts
import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";

import type { User, UserStatus } from "../../../models";
import type { PhoneNumberParam, UserIdParam } from "../../types";

export interface CreateUserParams {
  phoneNumber: string;
  isOnApp?: boolean;
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

  createUser(params: CreateUserParams, tx: Transaction): Promise<void>;

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

  updateUserOnAppStatus(
    params: { userId: string; isOnApp: boolean },
    db?: DatabaseOrTransaction,
  ): Promise<void>;
}

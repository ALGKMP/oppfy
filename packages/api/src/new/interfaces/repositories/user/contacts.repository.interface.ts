import type { DatabaseOrTransaction, Transaction } from "@oppfy/db";

import type { UserIdParam } from "../../types";

export interface DeleteUserContactsParam {
  userId: string;
  contactIds: string[];
}

export interface InsertUserContactsParam {
  userId: string;
  contactIds: string[];
}

export interface IContactsRepository {
  findUserContacts(
    params: UserIdParam,
    db: DatabaseOrTransaction,
  ): Promise<{ userId: string; contactId: string }[]>;

  deleteUserContactsByIds(
    params: DeleteUserContactsParam,
    tx: Transaction,
  ): Promise<void>;

  insertUserContacts(
    params: InsertUserContactsParam,
    tx: Transaction,
  ): Promise<void>;

  getRecommendationIds(params: UserIdParam): Promise<{
    tier1: string[];
    tier2: string[];
    tier3: string[];
  }>;
}

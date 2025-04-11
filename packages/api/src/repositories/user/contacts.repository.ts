import { and, eq, inArray } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";
import { env } from "@oppfy/env";

import type { UserIdParam } from "../../interfaces/types";
import { TYPES } from "../../symbols";

export interface DeleteUserContactsParam {
  userId: string;
  contactIds: string[];
}

export interface InsertUserContactsParam {
  userId: string;
  contactIds: string[];
}

@injectable()
export class ContactsRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async findUserContacts(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<{ userId: string; contactId: string }[]> {
    return db.query.userContact.findMany({
      where: eq(this.schema.userContact.userId, userId),
    });
  }

  async deleteUserContactsByIds(
    { userId, contactIds }: DeleteUserContactsParam,
    tx: Transaction,
  ): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }
    await tx
      .delete(this.schema.userContact)
      .where(
        and(
          eq(this.schema.userContact.userId, userId),
          inArray(this.schema.userContact.contactId, contactIds),
        ),
      );
  }

  async insertUserContacts(
    { userId, contactIds }: InsertUserContactsParam,
    tx: Transaction,
  ): Promise<void> {
    if (contactIds.length === 0) {
      return;
    }

    const mappings = contactIds.map((contactId) => ({
      userId,
      contactId,
    }));

    await tx
      .insert(this.schema.userContact)
      .values(mappings)
      .onConflictDoNothing();
  }

  async getRecommendationIds({ userId }: UserIdParam): Promise<{
    tier1: string[];
    tier2: string[];
    tier3: string[];
  }> {
    const lambdaUrl = env.CONTACT_REC_LAMBDA_URL;

    // Construct the full URL with the query parameter
    const url = new URL(lambdaUrl);
    url.searchParams.append("userId", userId);

    try {
      // make the request
      const response = await fetch(url);

      if (response.status !== 200) {
        console.error(
          "Error invoking Lambda function: ",
          await response.text(),
          response.status,
        );
        return { tier1: [], tier2: [], tier3: [] };
      }

      return (await response.json()) as {
        tier1: string[];
        tier2: string[];
        tier3: string[];
      };
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      return { tier1: [], tier2: [], tier3: [] };
    }
  }
}

import { and, eq, inArray, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";
import { env } from "@oppfy/env";

import { TYPES } from "../container";
import type {
  ContactRecommendation,
  DeleteContactsParams,
  GetContactsParams,
  GetRecommendationsParams,
  IContactsRepository,
  UpdateUserContactsParams,
} from "../interfaces/repositories/contactsRepository.interface";

@injectable()
export class ContactsRepository implements IContactsRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async updateUserContacts(
    params: UpdateUserContactsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, hashedPhoneNumbers } = params;

    const oldContacts = await tx.query.userContact.findMany({
      where: eq(this.schema.userContact.userId, userId),
    });

    // Find contacts to delete
    const contactsToDelete = oldContacts
      .filter((contact) => !hashedPhoneNumbers.includes(contact.contactId))
      .map((contact) => contact.contactId);

    // Find contacts to add
    const contactsToAdd = hashedPhoneNumbers.filter(
      (hashedPhoneNumber) =>
        !oldContacts.some((contact) => contact.contactId === hashedPhoneNumber),
    );

    // Batch delete contacts
    if (contactsToDelete.length > 0) {
      await tx
        .delete(this.schema.userContact)
        .where(
          and(
            eq(this.schema.userContact.userId, userId),
            inArray(this.schema.userContact.contactId, contactsToDelete),
          ),
        );
    }

    // Batch insert contacts into `contact` table if they don't exist
    if (contactsToAdd.length > 0) {
      const existingContacts = await tx.query.contact.findMany({
        where: inArray(this.schema.contact.id, contactsToAdd),
      });

      const newContactsToInsert = new Set(
        contactsToAdd.filter(
          (contact) =>
            !existingContacts.some((existing) => existing.id === contact),
        ),
      );

      if (newContactsToInsert.size > 0) {
        await tx
          .insert(this.schema.contact)
          .values(Array.from(newContactsToInsert).map((id) => ({ id })));
      }

      // Batch insert into `userContact` table
      const userContactsToInsert = contactsToAdd.map((contact) => ({
        userId,
        contactId: contact,
      }));

      await tx
        .insert(this.schema.userContact)
        .values(userContactsToInsert)
        .onConflictDoNothing();
    }
  }

  async deleteContacts(
    params: DeleteContactsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId } = params;

    await tx
      .delete(this.schema.userContact)
      .where(eq(this.schema.userContact.userId, userId));
  }

  async getContacts(
    params: GetContactsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<string[]> {
    const { userId } = params;

    const contacts = await tx.query.userContact.findMany({
      where: eq(this.schema.userContact.userId, userId),
    });

    return contacts.map((contact) => contact.contactId);
  }

  async getRecommendations(
    params: GetRecommendationsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<ContactRecommendation[]> {
    const { userId } = params;

    // Get recommendations from Lambda function
    const recommendations = await this.getRecommendationsFromLambda(userId);

    // Combine all tiers
    const allRecommendedUserIds = [
      ...recommendations.tier1,
      ...recommendations.tier2,
      ...recommendations.tier3,
    ];

    if (allRecommendedUserIds.length === 0) {
      return [];
    }

    // Get user profiles for recommendations
    const userProfiles = await tx
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(inArray(this.schema.user.id, allRecommendedUserIds));

    // Get mutual contacts count for each recommendation
    const userContactsMap = new Map<string, string[]>();

    // Get user's contacts
    const userContacts = await tx.query.userContact.findMany({
      where: eq(this.schema.userContact.userId, userId),
    });

    userContactsMap.set(
      userId,
      userContacts.map((contact) => contact.contactId),
    );

    // Get contacts for each recommended user
    for (const recommendedUserId of allRecommendedUserIds) {
      const contacts = await tx.query.userContact.findMany({
        where: eq(this.schema.userContact.userId, recommendedUserId),
      });

      userContactsMap.set(
        recommendedUserId,
        contacts.map((contact) => contact.contactId),
      );
    }

    // Calculate mutual contacts
    const result: ContactRecommendation[] = [];

    for (const profile of userProfiles) {
      const userContactIds = userContactsMap.get(userId) || [];
      const recommendedUserContactIds =
        userContactsMap.get(profile.userId) || [];

      const mutualContacts = userContactIds.filter((contactId) =>
        recommendedUserContactIds.includes(contactId),
      );

      result.push({
        userId: profile.userId,
        username: profile.username,
        name: profile.name,
        profilePictureUrl: profile.profilePictureUrl,
        mutualContactsCount: mutualContacts.length,
      });
    }

    // Sort by tier and then by mutual contacts count
    return result.sort((a, b) => {
      const aTier = this.getTier(a.userId, recommendations);
      const bTier = this.getTier(b.userId, recommendations);

      if (aTier !== bTier) {
        return aTier - bTier;
      }

      return b.mutualContactsCount - a.mutualContactsCount;
    });
  }

  private getTier(
    userId: string,
    recommendations: { tier1: string[]; tier2: string[]; tier3: string[] },
  ): number {
    if (recommendations.tier1.includes(userId)) {
      return 1;
    } else if (recommendations.tier2.includes(userId)) {
      return 2;
    } else {
      return 3;
    }
  }

  private async getRecommendationsFromLambda(
    userId: string,
  ): Promise<{ tier1: string[]; tier2: string[]; tier3: string[] }> {
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

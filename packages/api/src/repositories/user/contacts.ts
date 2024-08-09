import { and, db, eq, inArray, or, schema } from "@oppfy/db";
import { env } from "@oppfy/env";

import { handleDatabaseErrors } from "../../errors";

export class ContactsRepository {
  private db = db;

  @handleDatabaseErrors
  async updateUserContacts(userId: string, hashedPhoneNumbers: string[]) {
    return await this.db.transaction(async (tx) => {
      const oldContacts = await tx.query.userContact.findMany({
        where: eq(schema.userContact.userId, userId),
      });

      // Find contacts to delete
      const contactsToDelete = oldContacts
        .filter((contact) => !hashedPhoneNumbers.includes(contact.contactId))
        .map((contact) => contact.contactId);

      // Find contacts to add
      const contactsToAdd = hashedPhoneNumbers.filter(
        (hashedPhoneNumber) =>
          !oldContacts.some(
            (contact) => contact.contactId === hashedPhoneNumber,
          ),
      );

      // Batch delete contacts
      if (contactsToDelete.length > 0) {
        await tx
          .delete(schema.userContact)
          .where(
            and(
              eq(schema.userContact.userId, userId),
              inArray(schema.userContact.contactId, contactsToDelete),
            ),
          );
      }

      // Batch insert contacts into `contact` table if they don't exist
      if (contactsToAdd.length > 0) {
        const existingContacts = await tx.query.contact.findMany({
          where: inArray(schema.contact.id, contactsToAdd),
        });

        const newContactsToInsert = contactsToAdd.filter(
          (contact) =>
            !existingContacts.some((existing) => existing.id === contact),
        );

        if (newContactsToInsert.length > 0) {
          await tx
            .insert(schema.contact)
            .values(newContactsToInsert.map((id) => ({ id })));
        }

        // Batch insert into `userContact` table
        const userContactsToInsert = contactsToAdd.map((contact) => ({
          userId,
          contactId: contact,
        }));

        await tx
          .insert(schema.userContact)
          .values(userContactsToInsert)
          .onConflictDoNothing();
      }
    });
  }

  @handleDatabaseErrors
  async deleteContacts(userId: string) {
    return await this.db
      .delete(schema.userContact)
      .where(eq(schema.userContact.userId, userId));
  }

  @handleDatabaseErrors
  async getContacts(userId: string) {
    return await this.db.query.userContact.findMany({
      where: eq(schema.userContact.userId, userId),
    });
  }

  @handleDatabaseErrors
  async getRecommendationsInternal(userId: string) {
    const lambdaUrl = env.CONTACT_REC_LAMBDA_URL;

    // Construct the full URL with the query parameter
    const url = new URL(lambdaUrl);
    url.searchParams.append("userId", userId);

    // make the request
    const response = await fetch(url);

    if (response.status !== 200) {
      console.error("Error invoking Lambda function: ", await response.text());
      return {
        tier1: [],
        tier2: [],
        tier3: [],
      };
    }

    return (await response.json()) as {
      tier1: string[];
      tier2: string[];
      tier3: string[];
    };
  }
}

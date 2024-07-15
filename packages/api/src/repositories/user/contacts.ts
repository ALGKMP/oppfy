import { and, db, eq, or, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";
import { env } from "@oppfy/env";

export class ContactsRepository {
  private db = db;

  @handleDatabaseErrors
  async updateUserContacts(userId: string, hashedPhoneNumbers: string[]) {
    return await this.db.transaction(async (tx) => {
      let oldContacts = await tx.query.userContact.findMany({
        where: eq(schema.userContact.userId, userId),
      });

      // contacts to delete
      const contactsToDelete = oldContacts.filter(
        (contact) => !hashedPhoneNumbers.includes(contact.contactId),
      );

      // contacts to add
      const contactsToAdd = hashedPhoneNumbers.filter(
        (hashedPhoneNumber) =>
          !oldContacts.some(
            (contact) => contact.contactId === hashedPhoneNumber,
          ),
      );

      // delete contacts
      await tx
        .delete(schema.userContact)
        .where(
          and(
            eq(schema.userContact.userId, userId),
            or(
              ...contactsToDelete.map((contact) =>
                eq(schema.userContact.contactId, contact.contactId),
              ),
            ),
          ),
        );

      // add contacts, if the contact is not in the contact table add it there firs then add it to the userContact table
      for (const contact of contactsToAdd) {
        const contactId = await tx.query.contact.findFirst({
          where: eq(schema.contact.id, contact),
        });

        if (!contactId) {
          await tx.insert(schema.contact).values({ id: contact });
        }

        // Check if the user_contact entry already exists
        const userContactExists = await tx.query.userContact.findFirst({
          where: and(
            eq(schema.userContact.userId, userId),
            eq(schema.userContact.contactId, contact),
          ),
        });

        if (!userContactExists) {
          try {
            await tx.insert(schema.userContact).values({
              userId,
              contactId: contact,
            });
          } catch (error) {
            // error here is going to be duplicate if that happens for some reason,
            // just catching it here and ignoring it is faster than actually checking
            // if there's a collision on every single one lol
          }
        }
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
  async getRecommendationsInternal(userId: string) {
    const lambdaUrl = env.CONTACT_REC_LAMBDA_URL;
  
    // Construct the full URL with the query parameter
    const url = new URL(lambdaUrl);
    url.searchParams.append("userId", userId);
  
    // make the request
    const response = await fetch(url);
  
    if (response.status !== 200) {
      console.error("Error invoking Lambda function: ", response.statusText);
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

import { and, db, eq, or, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class ContactsRepository {
  private db = db;

  @handleDatabaseErrors
  async updateUserContacts(userId: string, hashedPhoneNumbers: string[]) {
    return await this.db.transaction(async (tx) => {
      let oldContacts = await tx.query.userContact.findMany({
        where: eq(schema.userContact.userId, userId),
      });

      oldContacts.forEach(
        (c) => (c.contactId = Buffer.from(c.contactId, "hex").toString()),
      );

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

        try {
          await tx.insert(schema.userContact).values({
            userId,
            contactId: contact,
          });
        } catch (error) {
          // error here is going to be duplicate if that happens for some reason,
          // just catching it here and ignoring it is faster than actually checking
          // if theres a collision on every single one lol
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
}

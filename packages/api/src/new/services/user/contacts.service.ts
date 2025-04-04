import { inject, injectable } from "inversify";
import { ok, Result } from "neverthrow";

import type { Database, DatabaseOrTransaction, Transaction } from "@oppfy/db";

import { TYPES } from "../../container";
import * as AwsErrors from "../../errors/aws.error";
import * as UserErrors from "../../errors/user/user.error";
import type { IContactsRepository } from "../../interfaces/repositories/user/contacts.repository.interface";
import {
  ContactRecommendation,
  FilterPhoneNumbersOnAppParams,
  GetRecommendationParams,
  IContactsService,
  UpdateUserContactsParams,
} from "../../interfaces/services/user/contacts.service.interface";
import { HydratedProfile } from "../../models";

@injectable()
export class ContactsService implements IContactsService {
  private db: Database;
  private contactsRepository: IContactsRepository;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.ContactsRepository) contactsRepository: IContactsRepository,
  ) {
    this.db = db;
    this.contactsRepository = contactsRepository;
  }

  filterPhoneNumbersOnApp(
    params: FilterPhoneNumbersOnAppParams,
  ): Promise<string[]> {
    throw new Error("Method not implemented.");
  }

  getProfileRecommendations(
    params: GetRecommendationParams,
  ): Promise<Result<HydratedProfile[], UserErrors.UserNotFound>> {
    throw new Error("Method not implemented.");
  }

  async updateUserContacts(
    params: UpdateUserContactsParams,
  ): Promise<
    Result<void, UserErrors.UserNotFound | AwsErrors.SQSFailedToSend>
  > {
    const { userId, hashedPhoneNumbers } = params;

    await this.db.transaction(async (tx) => {
      // 1. Get current contacts
      const oldContacts = await this.contactsRepository.findUserContacts(
        { userId },
        tx,
      );
      const oldContactIds = oldContacts.map((contact) => contact.contactId);

      // 2. Calculate differences
      const contactsToDelete = oldContactIds.filter(
        (contactId) => !hashedPhoneNumbers.includes(contactId),
      );

      const contactsToAdd = hashedPhoneNumbers.filter(
        (hashedPhoneNumber) => !oldContactIds.includes(hashedPhoneNumber),
      );

      // 3. Perform database operations within the transaction
      // Delete old contacts
      await this.contactsRepository.deleteUserContactsByIds(
        { userId, contactIds: contactsToDelete },
        tx,
      );

      // Ensure new contact IDs exist in the contact table
      // await this.contactsRepository.ensureContactsExist(contactsToAdd, tx);

      await this.contactsRepository.insertUserContacts(
        { userId, contactIds: contactsToAdd },
        tx,
      );
    });

    return ok(undefined);
  }

  // async getRecommendations(
  //   params: GetRecommendationsParams,
  // ): Promise<ContactRecommendation[]> {
  //   const { userId } = params;

  //   // Get recommendations from Lambda function
  //   const recommendations = await this.contactsRepository.getRecommendationIds(userId);

  //   // Combine all tiers
  //   const allRecommendedUserIds = [
  //     ...recommendations.tier1,
  //     ...recommendations.tier2,
  //     ...recommendations.tier3,
  //   ];

  //   if (allRecommendedUserIds.length === 0) {
  //     return [];
  //   }

  //   // Get user profiles for recommendations
  //   const userProfiles = await this.db
  //     .select({
  //       userId: this.schema.user.id,
  //       username: this.schema.profile.username,
  //       name: this.schema.profile.name,
  //       profilePictureUrl: this.schema.profile.profilePictureKey,
  //     })
  //     .from(this.schema.user)
  //     .innerJoin(
  //       this.schema.profile,
  //       eq(this.schema.user.id, this.schema.profile.userId),
  //     )
  //     .where(inArray(this.schema.user.id, allRecommendedUserIds));

  //   // Get mutual contacts count for each recommendation
  //   const userContactsMap = new Map<string, string[]>();

  //   // Get user's contacts
  //   const userContacts = await this.contactsRepository.findUserContacts(userId, this.db);

  //   userContactsMap.set(
  //     userId,
  //     userContacts.map((contact) => contact.contactId),
  //   );

  //   // Get contacts for each recommended user
  //   for (const recommendedUserId of allRecommendedUserIds) {
  //     const contacts = await this.findUserContacts(recommendedUserId, db);

  //     userContactsMap.set(
  //       recommendedUserId,
  //       contacts.map((contact) => contact.contactId),
  //     );
  //   }

  //   // Calculate mutual contacts
  //   const result: ContactRecommendation[] = [];

  //   for (const profile of userProfiles) {
  //     const userContactIds = userContactsMap.get(userId) ?? [];
  //     const recommendedUserContactIds =
  //       userContactsMap.get(profile.userId) ?? [];

  //     const mutualContacts = userContactIds.filter((contactId) =>
  //       recommendedUserContactIds.includes(contactId),
  //     );

  //     result.push({
  //       userId: profile.userId,
  //       username: profile.username,
  //       name: profile.name,
  //       profilePictureUrl: profile.profilePictureUrl,
  //       mutualContactsCount: mutualContacts.length,
  //     });
  //   }

  //   // Sort by tier and then by mutual contacts count
  //   return result.sort((a, b) => {
  //     const aTier = this.getTier(a.userId, recommendations);
  //     const bTier = this.getTier(b.userId, recommendations);

  //     if (aTier !== bTier) {
  //       return aTier - bTier;
  //     }

  //     return b.mutualContactsCount - a.mutualContactsCount;
  //   });
  // }

  // private getTier(
  //   userId: string,
  //   recommendations: { tier1: string[]; tier2: string[]; tier3: string[] },
  // ): number {
  //   if (recommendations.tier1.includes(userId)) {
  //     return 1;
  //   } else if (recommendations.tier2.includes(userId)) {
  //     return 2;
  //   } else {
  //     return 3;
  //   }
  // }
}

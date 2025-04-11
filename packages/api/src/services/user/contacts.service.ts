import { inject, injectable } from "inversify";
import { ok, Result } from "neverthrow";

import { CloudFront } from "@oppfy/cloudfront";
import type { Database, DatabaseOrTransaction, Transaction } from "@oppfy/db";

<<<<<<< HEAD
import { TYPES } from "../../container";
=======
import type { IContactsRepository } from "../../interfaces/repositories/user/contacts.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import {
  ContactRecommendation,
  FilterPhoneNumbersOnAppParams,
  IContactsService,
  UpdateUserContactsParams,
} from "../../interfaces/services/user/contacts.service.interface";
>>>>>>> fb90d89965f6dc2b36a52fcaef1de4b498635e76
import { UserIdParam } from "../../interfaces/types";
import { HydratedProfile } from "../../models";
import { ContactsRepository } from "../../repositories/user/contacts.repository";
import { UserRepository } from "../../repositories/user/user.repository";

export interface UpdateUserContactsParams {
  userId: string;
  hashedPhoneNumbers: string[];
}

export interface FilterPhoneNumbersOnAppParams {
  phoneNumbers: string[];
}

export interface ContactRecommendation {
  userId: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  mutualContactsCount: number;
}

@injectable()
<<<<<<< HEAD
export class ContactsService {
  private db: Database;
  private contactsRepository: ContactsRepository;
  private userRepository: UserRepository;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.ContactsRepository) contactsRepository: ContactsRepository,
    @inject(TYPES.UserRepository) userRepository: UserRepository,
  ) {
    this.db = db;
    this.contactsRepository = contactsRepository;
    this.userRepository = userRepository;
  }
=======
export class ContactsService implements IContactsService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.CloudFront)
    private readonly cloudfront: CloudFront,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.ContactsRepository)
    private readonly contactsRepository: IContactsRepository,
  ) {}
>>>>>>> fb90d89965f6dc2b36a52fcaef1de4b498635e76

  async filterPhoneNumbersOnApp({
    phoneNumbers,
  }: FilterPhoneNumbersOnAppParams): Promise<Result<string[], never>> {
    const result = await this.userRepository.existingPhoneNumbers({
      phoneNumbers,
    });

    return ok(result);
  }

  async getProfileRecommendations({
    userId,
  }: UserIdParam): Promise<Result<HydratedProfile[], never>> {
    // Get recommendations from Lambda function
    const { tier1, tier2, tier3 } =
      await this.contactsRepository.getRecommendationIds({ userId });

    // Combine all tiers
    const allRecommendedUserIds = [...tier1, ...tier2, ...tier3];

    if (allRecommendedUserIds.length === 0) {
      return ok([]);
    }

    const profiles = await this.profileRepository.getProfilesByIds({
      userIds: allRecommendedUserIds,
    });

    const hydratedProfiles = profiles.map((profile) =>
      this.cloudfront.hydrateProfile(profile),
    );

    return ok(hydratedProfiles);
  }

  async updateUserContacts(
    params: UpdateUserContactsParams,
  ): Promise<Result<void, never>> {
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

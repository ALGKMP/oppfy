import { createHash } from "crypto";
import { inject, injectable } from "inversify";
import { err, ok } from "neverthrow";

import { cloudfront } from "@oppfy/cloudfront";
import type { Transaction } from "@oppfy/db";
import { sqs } from "@oppfy/sqs";

import { TYPES } from "../../container";
import { AwsErrors } from "../../errors/aws.error";
import { UserErrors } from "../../errors/user/user.error";
import type {
  DeleteContactsParams,
  DeleteContactsResult,
  FilterPhoneNumbersOnAppParams,
  GetRecomendationIdsResult,
  GetRecommendationProfilesSelfParams,
  GetRecommendationProfilesSelfResult,
  GetRecommendationsIdsParams,
  IContactService,
  SyncContactsParams,
  SyncContactsResult,
} from "../../interfaces/services/user/contactService.interface";
import { ContactsRepository } from "../../repositories/user/contacts.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { UserRepository } from "../../repositories/user/user.repository";

@injectable()
export class ContactService implements IContactService {
  private contactsRepository: ContactsRepository;
  private userRepository: UserRepository;
  private profileRepository: ProfileRepository;
  private tx: Transaction;

  constructor(
    @inject(TYPES.Transaction) tx: Transaction,
    @inject(TYPES.UserRepository) userRepository: UserRepository,
    @inject(TYPES.ProfileRepository) profileRepository: ProfileRepository,
    @inject(TYPES.ContactsRepository) contactsRepository: ContactsRepository,
  ) {
    this.tx = tx;
    this.userRepository = userRepository;
    this.profileRepository = profileRepository;
    this.contactsRepository = contactsRepository;
  }

  async syncContacts({
    userId,
    contacts,
  }: SyncContactsParams): Promise<SyncContactsResult> {
    const user = await this.userRepository.getUser({ userId });

    if (user === undefined) {
      return err(new UserErrors.UserNotFound(userId));
    }

    // hash the users own phone number and remove from contacts if its in there
    const userPhoneNumber = user.phoneNumber;
    const userPhoneNumberHash = createHash("sha512")
      .update(userPhoneNumber)
      .digest("hex");

    const filteredContacts = contacts.filter(
      (contact) => contact !== userPhoneNumberHash,
    );

    // update the contacts in the db
    await this.contactsRepository.updateUserContacts(
      {
        userId,
        hashedPhoneNumbers: filteredContacts,
      },
      this.tx,
    );

    try {
      await sqs.sendContactSyncMessage({
        userId,
        userPhoneNumberHash,
        contacts: filteredContacts,
      });
    } catch {
      return err(
        new AwsErrors.SQSFailedToSend(
          "SQS failed while trying to send contact sync message",
        ),
      );
    }

    return ok();
  }

  async deleteContacts({
    userId,
  }: DeleteContactsParams): Promise<DeleteContactsResult> {
    const user = await this.userRepository.getUser({ userId });

    if (user === undefined) {
      return err(new UserErrors.UserNotFound(userId));
    }

    // hash the users own phone number and remove from contacts if its in there
    const userPhoneNumber = user.phoneNumber;
    const userPhoneNumberHash = createHash("sha512")
      .update(userPhoneNumber)
      .digest("hex");

    await this.contactsRepository.deleteContacts({ userId });

    try {
      await sqs.sendContactSyncMessage({
        userId,
        userPhoneNumberHash,
        contacts: [],
      });
    } catch {
      return err(
        new AwsErrors.SQSFailedToSend(
          "SQS failed while trying to send contact delete message",
        ),
      );
    }

    return ok();
  }

  async filterPhoneNumbersOnApp({
    phoneNumbers,
  }: FilterPhoneNumbersOnAppParams): Promise<string[]> {
    if (phoneNumbers.length === 0) {
      return [];
    }

    const existingPhoneNumbers = await this.userRepository.existingPhoneNumbers(
      {
        phoneNumbers,
      },
    );

    return phoneNumbers.filter(
      (number) => !existingPhoneNumbers.includes(number),
    );
  }

  async getRecommendationsIds({
    userId,
  }: GetRecommendationsIdsParams): Promise<GetRecomendationIdsResult> {
    const user = await this.userRepository.getUser({ userId });

    if (user === undefined) {
      return err(new UserErrors.UserNotFound(userId));
    }

    //TODO: look at
    const thing = await this.contactsRepository.getRecommendationIds(userId);
    return ok(thing);
  }

  async getRecommendationProfilesSelf({
    userId,
  }: GetRecommendationProfilesSelfParams): Promise<GetRecommendationProfilesSelfResult> {
    const user = await this.userRepository.getUser({ userId });

    if (user === undefined) {
      return err(new UserErrors.UserNotFound(userId));
    }

    const recommendationsIds = (
      await this.getRecommendationsIds({ userId })
    ).unwrapOr({
      tier1: [],
      tier2: [],
      tier3: [],
    });

    let allRecommendations = [
      ...recommendationsIds.tier1,
      ...recommendationsIds.tier2,
      ...recommendationsIds.tier3,
    ];

    if (allRecommendations.length === 0) {
      const randomProfiles =
        await this.userRepository.getRandomActiveProfilesForRecs({
          limit: 10,
        });
      allRecommendations = randomProfiles
        .map((profile) => profile.userId)
        .filter((id) => id !== userId);
    }

    // TODO: ADD BACK
    // start a transaction to get all the usernames and profilePhotos
    const profiles = await this.profileRepository.getBatchProfiles({
      userIds: allRecommendations,
    });
    // Fetch presigned URLs for profile pictures in parallel
    const profilesWithUrls = await Promise.all(
      profiles.map(async (profile) => {
        const { profilePictureKey, ...profileWithoutKey } = profile;
        return {
          ...profileWithoutKey,
          relationshipStatus: "notFollowing" as const,
          profilePictureUrl: profilePictureKey
            ? await cloudfront.getSignedProfilePictureUrl(profilePictureKey)
            : null,
        };
      }),
    );

    // Filter out any rejected promises and return the successful ones
    return ok(profilesWithUrls);
  }
}

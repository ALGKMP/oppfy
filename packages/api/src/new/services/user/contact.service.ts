import { createHash } from "crypto";
import { inject, injectable } from "inversify";
import { err, ok } from "neverthrow";

import { CloudFront } from "@oppfy/cloudfront";
import type { Transaction } from "@oppfy/db";
import { sqs } from "@oppfy/sqs";

import { TYPES } from "../../container";
import * as AwsErrors from "../../errors/aws.error";
import * as UserErrors from "../../errors/user/user.error";
import type {
  DeleteContactsParams,
  DeleteContactsResult,
  FilterPhoneNumbersOnAppParams,
  GetRecommendationProfilesResult,
  GetRecommendationProfilesSelfParams,
  IContactService,
  SyncContactsParams,
  SyncContactsResult,
} from "../../interfaces/services/user/contact.service.interface";
import { ContactsRepository } from "../../repositories/user/contacts.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { UserRepository } from "../../repositories/user/user.repository";

@injectable()
export class ContactService implements IContactService {
  constructor(
    @inject(TYPES.Transaction)
    private readonly tx: Transaction,
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TYPES.ContactsRepository)
    private readonly contactsRepository: ContactsRepository,
    @inject(TYPES.CloudFront)
    private readonly cloudfront: CloudFront,
  ) {}

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

  async getProfileRecommendations({
    userId,
  }: GetRecommendationProfilesSelfParams): Promise<GetRecommendationProfilesResult> {
    const user = await this.userRepository.getUser({ userId });

    if (user === undefined) {
      return err(new UserErrors.UserNotFound(userId));
    }

    const { tier1, tier2, tier3 } =
      await this.contactsRepository.getRecommendationIds(userId);
    let allRecommendations = [...tier1, ...tier2, ...tier3];

    if (allRecommendations.length === 0) {
      const randomProfiles = await this.userRepository.getRandomActiveUserIds({
        pageSize: 10,
      });
      allRecommendations = randomProfiles
        .map((profile) => profile.userId)
        .filter((id) => id !== userId);
    }

    const profiles = await this.profileRepository.getProfilesByIds({
      userIds: allRecommendations,
    });

    const profilesWithUrls = profiles.map((profile) => {
      return this.cloudfront.hydrateProfile(profile);
    });

    return ok(profilesWithUrls);
  }
}

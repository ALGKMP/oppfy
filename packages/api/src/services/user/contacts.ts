import { createHash } from "crypto";

import { DomainError, ErrorCode } from "../../errors";
import {
  ContactsRepository,
  ProfileRepository,
  UserRepository,
} from "../../repositories";

type RelationshipStatus = "notFollowing" | "following" | "requested";

export class ContactService {
  private contactsRepository = new ContactsRepository();
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();

  async syncContacts(userId: string, contacts: string[]) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
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
    await this.contactsRepository.updateUserContacts(userId, filteredContacts);

    await this.contactsRepository.sendContactSyncMessage({
      userId,
      userPhoneNumberHash,
      contacts: filteredContacts,
    });
  }

  async deleteContacts(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    // hash the users own phone number and remove from contacts if its in there
    const userPhoneNumber = user.phoneNumber;

    const userPhoneNumberHash = createHash("sha512")
      .update(userPhoneNumber)
      .digest("hex");

    await this.contactsRepository.deleteContacts(userId);

    await this.contactsRepository.sendContactSyncMessage({
      userId,
      userPhoneNumberHash,
      contacts: [],
    });
  }

  async filterPhoneNumbersOnApp(phoneNumbers: string[]) {
    if (phoneNumbers.length === 0) {
      return [];
    }
    const existingPhoneNumbers =
      await this.userRepository.existingPhoneNumbers(phoneNumbers);

    return phoneNumbers.filter(
      (number) => !existingPhoneNumbers.includes(number),
    );
  }

  async getRecommendationsIds(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    return await this.contactsRepository.getRecommendationsInternal(userId);
  }

  async getRecommendationProfilesSelf(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const recommendationsIds = await this.getRecommendationsIds(userId);

    let allRecommendations = [
      ...recommendationsIds.tier1,
      ...recommendationsIds.tier2,
      ...recommendationsIds.tier3,
    ];

    if (allRecommendations.length === 0) {
      const randomProfiles =
        await this.userRepository.getRandomActiveProfilesForRecs(userId, 10);
      allRecommendations = randomProfiles
        .map((profile) => profile.userId)
        .filter((id) => id !== userId);
    }

    // start a transaction to get all the usernames and profilePhotos
    const profiles =
      await this.profileRepository.getBatchProfiles(allRecommendations);
    // Fetch presigned URLs for profile pictures in parallel
    const profilesWithUrls = await Promise.all(
      profiles.map(async (profile) => {
        const { profilePictureKey, ...profileWithoutKey } = profile;
        return {
          ...profileWithoutKey,
          relationshipStatus: "notFollowing" as RelationshipStatus,
          profilePictureUrl: profilePictureKey
            ? await this.profileRepository.getSignedProfilePictureUrl(
                profilePictureKey,
              )
            : null,
        };
      }),
    );

    // Filter out any rejected promises and return the successful ones
    return profilesWithUrls;
  }
}

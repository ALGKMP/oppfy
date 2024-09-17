import { createHash } from "crypto";
import { z } from "zod";

import { and, db, inArray, notInArray, schema, sql } from "@oppfy/db";
import { env } from "@oppfy/env";
import { sqs } from "@oppfy/sqs";

import { DomainError, ErrorCode } from "../../errors";
import {
  ContactsRepository,
  FollowRepository,
  ProfileRepository,
  UserRepository,
} from "../../repositories";
import { CloudFrontService } from "../aws/cloudfront";
import { S3Service } from "../aws/s3";

export class ContactService {
  private contactsRepository = new ContactsRepository();
  private followRepository = new FollowRepository();
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();

  private cloudFrontService = new CloudFrontService();

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

    // get following list from profile
    const followingIds = await this.followRepository.getAllFollowingIds(userId);

    try {
      await sqs.send({
        id: userId + "_contactsync_" + Date.now().toString(),
        body: JSON.stringify({
          userId,
          userPhoneNumberHash,
          contacts: filteredContacts,
          followingIds,
        }),
      });
    } catch (error) {
      throw new DomainError(
        ErrorCode.AWS_ERROR,
        "Failed to send sqs message to contact sync queue",
      );
    }
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

    try {
      await sqs.send({
        id: userId + "_contactsync_" + Date.now().toString(),
        body: JSON.stringify({
          userId,
          userPhoneNumberHash,
          contacts: [],
          followingIds: [],
        }),
      });
    } catch (error) {
      throw new DomainError(
        ErrorCode.AWS_ERROR,
        "Failed to send sqs message to contact sync queue",
      );
    }
  }

  async filterPhoneNumbersOnApp(phoneNumbers: string[]) {
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
        await this.userRepository.getRandomActiveProfiles(10);
      allRecommendations = randomProfiles
        .map((profile) => profile.userId)
        .filter((id) => id !== userId);
    }

    // start a transaction to get all the usernames and profilePhotos
    const profiles =
      await this.profileRepository.getBatchProfiles(allRecommendations);
    // Fetch presigned URLs for profile pictures in parallel
    const profilesWithUrls = profiles.map((profile) => {
      const { profilePictureKey, ...profileWithoutKey } = profile;
      return {
        ...profileWithoutKey,
        profilePictureUrl: profilePictureKey
          ? this.cloudFrontService.getSignedUrlForProfilePicture(
              profilePictureKey,
            )
          : null,
      };
    });

    // Filter out any rejected promises and return the successful ones
    return profilesWithUrls;
  }
}

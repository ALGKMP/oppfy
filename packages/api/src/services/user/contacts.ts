import { createHash } from "crypto";

import { env } from "@oppfy/env/server";
import { sqs } from "@oppfy/sqs";

import { DomainError, ErrorCode } from "../../errors";
import {
  ContactsRepository,
  FollowRepository,
  UserRepository,
} from "../../repositories";

async function getRecommendationsInternal(userId: string) {
  const lambdaUrl =
    "https://h3tereq7y7xy4q7rre36tftbje0yoxsq.lambda-url.us-east-1.on.aws";

  // Construct the full URL with the query parameter
  const url = new URL(lambdaUrl);
  url.searchParams.append("userId", userId);

  /*   // Create the HTTP request
  const request = new HttpRequest({
    method: "GET",
    headers: {
      host: url.hostname,
    },
    hostname: url.hostname,
    path: `${url.pathname}${url.search}`,
  });

  // Sign the request
  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: region,
    service: "lambda",
    sha256: Uint8Array.from,
  });

  const signedRequest = await signer.sign(request); */

  // Make the request using fetch
  try {
    /*     const response = await fetch(url.toString(), {
      method: signedRequest.method,
      headers: signedRequest.headers as HeadersInit,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json(); */

    const response = await fetch(url.toString());
    return (await response.json()) as {
      tier1: string[];
      tier2: string[];
      tier3: string[];
    };
  } catch (error) {
    console.error("Error invoking Lambda function:", error);
    throw error;
  }
}

export class ContactService {
  private contactsRepository = new ContactsRepository();
  private followRepository = new FollowRepository();
  private userRepository = new UserRepository();

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

  async getRecomendationsIds(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    return await getRecommendationsInternal(userId);
  }

  async getRecommendationProfiles(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const recommendations = await this.getRecomendationsIds(userId);

    const profiles = await this.userRepository.getUsersByIds(
      recommendations.tier1,
    );

    return profiles;
  }
}

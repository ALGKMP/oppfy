import { env } from "@oppfy/env";

import { DomainError, ErrorCode } from "../../errors";
import { S3Repository } from "../../repositories/aws/s3";
import { SearchRepository } from "../../repositories/aws/search";
import { UserRepository } from "../../repositories/user/user";
import { CloudFrontService } from "./cloudfront";

export class SearchService {
  private searchRepository = new SearchRepository();
  private s3Repository = new S3Repository();
  private userRepository = new UserRepository();

  private cloudFrontService = new CloudFrontService();

  async profilesByUsername(username: string, currentUserId: string) {
    const user = await this.userRepository.getUser(currentUserId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profiles = await this.searchRepository.profilesByUsername(
      username,
      user.profileId, // profileId to ignore, we dont want to display ourselves
    );

    // Use Promise.all to get presigned URLs and return profiles with URLs
    const profilesWithUrls = profiles.map(
      ({ profilePictureKey, ...restProfile }) => {
        const profilePictureUrl =
          this.cloudFrontService.getSignedUrlForProfilePicture(
            profilePictureKey,
          );

        return {
          ...restProfile,
          profilePictureUrl,
        };
      },
    );

    return profilesWithUrls;
  }
}

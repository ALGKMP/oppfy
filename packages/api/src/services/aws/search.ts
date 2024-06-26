import { env } from "@oppfy/env/server";
import { DomainError, ErrorCode } from "../../errors";
import { S3Repository } from "../../repositories/aws/s3";
import { SearchRepository } from "../../repositories/aws/search";
import { UserRepository } from "../../repositories/user/user";

export class SearchService {
  private searchRepository = new SearchRepository();
  private s3Repository = new S3Repository();
  private userRepository = new UserRepository();

  async profilesByUsername(username: string, currentUserId: string) {
    const user = await this.userRepository.getUser(currentUserId);

    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profiles = await this.searchRepository.profilesByUsername(
      username,
      user.profileId,
    );

    // Use Promise.all to get presigned URLs and return profiles with URLs
    const profilesWithUrls = await Promise.all(
      profiles.map(async ({ profilePictureKey, ...restProfile }) => {
        const profilePictureUrl = await this.s3Repository.getObjectPresignedUrl(
          {
            Bucket: env.S3_PROFILE_BUCKET,
            Key: profilePictureKey,
          },
        );

        return {
          ...restProfile,
          profilePictureUrl,
        };
      }),
    );

    return profilesWithUrls;
  }
}

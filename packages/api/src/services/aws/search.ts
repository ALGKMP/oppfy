import { DomainError, ErrorCode } from "../../errors";
import { AwsRepository } from "../../repositories/aws";
import { SearchRepository } from "../../repositories/search";
import { UserRepository } from "../../repositories/user";

export class SearchService {
  private searchRepository = new SearchRepository();
  private awsRepository = new AwsRepository();
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
        const profilePictureUrl =
          await this.awsRepository.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: profilePictureKey,
          });

        return {
          ...restProfile,
          profilePictureUrl,
        };
      }),
    );

    return profilesWithUrls;
  }
}

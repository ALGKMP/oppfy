import { AwsRepository } from "../repositories/aws";
import { SearchRepository } from "../repositories/search";

export class SearchService {
  private searchRepository = new SearchRepository();
  private awsRepository = new AwsRepository();

  async profilesByUsername(username: string) {
    const profiles = await this.searchRepository.profilesByUsername(username);

    // Iterate over profiles to get presigned URLs for each profile picture
    const profilesWithUrls = await Promise.all(
      profiles.map(async (profile) => {
        const profilePictureUrl =
          await this.awsRepository.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: profile.url,
          });

        return {
          ...profile,
          profilePictureUrl,
        };
      }),
    );

    return profilesWithUrls;
  }
}

import { DomainError, ErrorCode } from "../../errors";
import { UserRepository } from "../../repositories/user/user";
import { CloudFrontService } from "./cloudfront";
import { ProfileRepository } from "../../repositories/user/profile";

export class SearchService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private cloudFrontService = new CloudFrontService();

  async profilesByUsername(username: string, currentUserId: string) {
    const user = await this.userRepository.getUser(currentUserId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profiles = await this.profileRepository.profilesByUsername(
      username,
      user.id, // userId to ignore, we dont want to display ourselves
    );

    // Use Promise.all to get presigned URLs and return profiles with URLs
    const profilesWithUrls = await Promise.all(
      profiles.map(async ({ profilePictureKey, ...restProfile }) => {
        const profilePictureUrl = profilePictureKey
          ? await this.cloudFrontService.getSignedUrlForProfilePicture(
              profilePictureKey,
            )
          : null;

        return {
          ...restProfile,
          profilePictureUrl,
        };
      }),
    );

    return profilesWithUrls;
  }
}

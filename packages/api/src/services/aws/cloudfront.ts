import { cloudfront } from "@oppfy/cloudfront";
import { env } from "@oppfy/env";

export class CloudFrontService {
  async getSignedUrlForPublicPost(objectKey: string) {
    const url = cloudfront.getPublicPostUrl(objectKey);
    const signedUrl = await cloudfront.getSignedUrl({ url });
    return signedUrl;
  }

  async getSignedUrlForPost(objectKey: string) {
    const url = cloudfront.getPrivatePostUrl(objectKey);
    const signedUrl = await cloudfront.getSignedUrl({ url });
    return signedUrl;
  }

  async getSignedUrlForProfilePicture(objectKey: string) {
    const url = cloudfront.getProfilePictureUrl(objectKey);
    const signedUrl = await cloudfront.getSignedUrl({ url });
    return signedUrl;
  }

  async invalidateUserPosts(userId: string) {
    const distributionId = env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_ID;
    // Invalidate posts where the user is the recipient
    const objectPattern = `/posts/*-${userId}-*.jpg`;
    await cloudfront.createInvalidation(distributionId, objectPattern);
  }

  async invalidateProfilePicture(userId: string) {
    const distributionId = env.CLOUDFRONT_PROFILE_DISTRIBUTION_ID;
    const objectPattern = `/profile-pictures/${userId}.jpg`;
    await cloudfront.createInvalidation(distributionId, objectPattern);
  }
}

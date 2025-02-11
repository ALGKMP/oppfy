import { cloudfront } from "@oppfy/cloudfront";
import { env } from "@oppfy/env";

export class CloudFrontService {
  async getSignedUrlForPublicPost(objectKey: string) {
    const url = this._getPublicPostDistributionDomainUrlForObject(
      `${objectKey}`,
    );
    const signedUrl = await cloudfront.getSignedUrl({ url });
    return signedUrl;
  }

  async getSignedUrlForPost(objectKey: string) {
    const url = this._getPostDistributionDomainUrlForObject(`${objectKey}`);
    const signedUrl = await cloudfront.getSignedUrl({ url });
    return signedUrl;
  }

  async getSignedUrlForProfilePicture(objectKey: string) {
    const url = this._getProfileDistributionDomainUrlForObject(`${objectKey}`);
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

  private _getPublicPostDistributionDomainUrlForObject(objectKey: string) {
    return `https://${env.CLOUDFRONT_PUBLIC_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  private _getPostDistributionDomainUrlForObject(objectKey: string) {
    return `https://${env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  private _getProfileDistributionDomainUrlForObject(objectKey: string) {
    return `https://${env.CLOUDFRONT_PROFILE_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }
}

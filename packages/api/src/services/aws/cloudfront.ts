import { env } from "@oppfy/env";

import { CloudFrontRepository } from "../../repositories/aws/cloudfront";

export class CloudFrontService {
  private cloudFrontRepository = new CloudFrontRepository();

  getSignedUrlForPost(objectKey: string) {
    const url = this._getPostDistributionDomainUrlForObject(`${objectKey}`);
    const signedUrl = this.cloudFrontRepository.getSignedUrl({ url });
    // console.log("signedUrlfrom the service", signedUrl);
    return signedUrl;
  }

  getSignedUrlForProfilePicture(objectKey: string) {
    const url = this._getProfileDistributionDomainUrlForObject(`${objectKey}`);
    const signedUrl = this.cloudFrontRepository.getSignedUrl({ url });
    // console.log("signedUrl from the service", signedUrl);
    return signedUrl;
  }

  async invalidateUserPosts(userId: string) {
    const distributionId = env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_ID;
    // Invalidate posts where the user is the recipient
    const objectPattern = `/posts/*-${userId}-*.jpg`;
    await this.cloudFrontRepository.createInvalidation(
      distributionId,
      objectPattern,
    );
  }

  private _getPostDistributionDomainUrlForObject(objectKey: string): string {
    const postDistributionDomain =
      env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_DOMAIN;
    return `https://${postDistributionDomain}/${objectKey.replace(/^\//, "")}`;
  }

  private _getProfileDistributionDomainUrlForObject(objectKey: string): string {
    const profileDistributionDomain =
      env.CLOUDFRONT_PROFILE_DISTRIBUTION_DOMAIN;
    return `https://${profileDistributionDomain}/${objectKey.replace(/^\//, "")}`;
  }
}

import { env } from "@oppfy/env";

import { CloudFrontRepository } from "../../repositories/aws/cloudfront";

export class CloudFrontService {
  private cloudFrontRepository = new CloudFrontRepository();

  getSignedUrlForPost(objectKey: string) {
    const url = this._getPostDistributionDomainUrlForObject(`${objectKey}`);
    const signedUrl = this.cloudFrontRepository.getSignedUrl({ url });
    console.log("signedUrlfrom the service", signedUrl);
    return signedUrl;
  }

  getSignedUrlForProfilePicture(objectKey: string) {
    const url = this._getProfileDistributionDomainUrlForObject(`${objectKey}`);
    const signedUrl = this.cloudFrontRepository.getSignedUrl({ url });
    console.log("signedUrl from the service", signedUrl);
    return signedUrl;
  }

  private _getPostDistributionDomainUrlForObject(objectKey: string): string {
    const postDistributionDomain = env.CLOUDFRONT_POST_DISTRIBUTION_DOMAIN;
    return `https://${postDistributionDomain}/${objectKey.replace(/^\//, "")}`;
  }

  private _getProfileDistributionDomainUrlForObject(objectKey: string): string {
    const profileDistributionDomain =
      env.CLOUDFRONT_PROFILE_DISTRIBUTION_DOMAIN;
    return `https://${profileDistributionDomain}/${objectKey.replace(/^\//, "")}`;
  }
}

import { env } from "@oppfy/env";

import { CloudFrontRepository } from "../../repositories/aws/cloudfront";

export class CloudFrontService {
  private cloudFrontRepository = new CloudFrontRepository();

  async getSignedUrlForPost(objectKey: string) {
    const url = this._getPostDistributionDomainUrlForObject(`${objectKey}`);
    return await this.cloudFrontRepository.getSignedUrl({ url });
  }

  async getSignedUrlForProfilePicture(objectKey: string) {
    const url = this._getProfileDistributionDomainUrlForObject(`${objectKey}`);
    return await this.cloudFrontRepository.getSignedUrl({ url });
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

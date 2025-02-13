import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import { env } from "@oppfy/env";

const ONE_HOUR = 60 * 60 * 1000;

export class CloudFrontService {
  private client: CloudFrontClient;

  constructor() {
    this.client = new CloudFrontClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  private getPublicPostDistributionDomainUrlForObject(
    objectKey: string,
  ): string {
    return `https://${env.CLOUDFRONT_PUBLIC_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  private getPostDistributionDomainUrlForObject(objectKey: string): string {
    return `https://${env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  private getProfileDistributionDomainUrlForObject(objectKey: string): string {
    return `https://${env.CLOUDFRONT_PROFILE_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  async getSignedUrl({ url }: { url: string }): Promise<string> {
    return getSignedUrl({
      url,
      keyPairId: env.CLOUDFRONT_PUBLIC_KEY_ID,
      privateKey: env.CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: new Date(Date.now() + ONE_HOUR).toISOString(),
    }) as unknown as Promise<string>;
  }

  async createInvalidation(
    distributionId: string,
    objectPattern: string,
  ): Promise<void> {
    const command = new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: 1,
          Items: [objectPattern],
        },
      },
    });

    await this.client.send(command);
  }

  getPublicPostUrl(objectKey: string): string {
    return this.getPublicPostDistributionDomainUrlForObject(objectKey);
  }

  getPrivatePostUrl(objectKey: string): string {
    return this.getPostDistributionDomainUrlForObject(objectKey);
  }

  getProfilePictureUrl(objectKey: string): string {
    return this.getProfileDistributionDomainUrlForObject(objectKey);
  }

  // New methods for post-related operations
  async invalidateUserPosts(userId: string): Promise<void> {
    const distributionId = env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_ID;
    const objectPattern = `/posts/*-${userId}-*.jpg`;
    await this.createInvalidation(distributionId, objectPattern);
  }

  // New methods for profile picture operations
  async invalidateProfilePicture(userId: string): Promise<void> {
    const distributionId = env.CLOUDFRONT_PROFILE_DISTRIBUTION_ID;
    const objectPattern = `/profile-pictures/${userId}.jpg`;
    await this.createInvalidation(distributionId, objectPattern);
  }

  async getSignedPublicPostUrl(objectKey: string): Promise<string> {
    const url = this.getPublicPostUrl(objectKey);
    return await this.getSignedUrl({ url });
  }

  async getSignedPrivatePostUrl(objectKey: string): Promise<string> {
    const url = this.getPrivatePostUrl(objectKey);
    return await this.getSignedUrl({ url });
  }

  async getSignedProfilePictureUrl(objectKey: string): Promise<string> {
    const url = this.getProfilePictureUrl(objectKey);
    return await this.getSignedUrl({ url });
  }
}

// Export a singleton instance
export const cloudfront = new CloudFrontService();

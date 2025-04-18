import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import type { InferSelectModel, schema } from "@oppfy/db";
import { env } from "@oppfy/env";

const ONE_HOUR = 60 * 60 * 1000;

export class CloudFront {
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

  getProfilePictureUrl(objectKey: string): string {
    return this.getProfilePictureDistributionDomainUrl(objectKey);
  }

  getPublicPostUrl(objectKey: string): string {
    return this.getPublicPostDistributionDomainUrl(objectKey);
  }

  async getSignedPrivatePostUrl(objectKey: string): Promise<string> {
    return await this.getSignedUrl({
      url: this.getPrivatePostDistributionDomainUrl(objectKey),
    });
  }

  async invalidatePost(key: string): Promise<void> {
    const distributionId = env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_ID;
    await this.createInvalidation(distributionId, key);
  }

  async invalidateProfilePicture(key: string): Promise<void> {
    const distributionId = env.CLOUDFRONT_PROFILE_PICTURE_DISTRIBUTION_ID;
    await this.createInvalidation(distributionId, key);
  }

  private async getSignedUrl({ url }: { url: string }): Promise<string> {
    return getSignedUrl({
      url,
      keyPairId: env.CLOUDFRONT_PUBLIC_KEY_ID,
      privateKey: env.CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: new Date(Date.now() + ONE_HOUR).toISOString(),
    }) as unknown as Promise<string>;
  }

  private getProfilePictureDistributionDomainUrl(objectKey: string): string {
    return `https://${env.CLOUDFRONT_PROFILE_PICTURE_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  private getPublicPostDistributionDomainUrl(objectKey: string): string {
    return `https://${env.CLOUDFRONT_PUBLIC_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  private getPrivatePostDistributionDomainUrl(objectKey: string): string {
    return `https://${env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  private async createInvalidation(
    distributionId: string,
    objectPattern: string,
  ): Promise<void> {
    const command = new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: 1,
          Items: [`/${objectPattern}`],
        },
      },
    });

    await this.client.send(command);
  }
}

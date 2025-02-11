import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import { env } from "@oppfy/env";

const ONE_HOUR = 60 * 60 * 1000;

const client = new CloudFrontClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const getPublicPostDistributionDomainUrlForObject = (objectKey: string) => {
  return `https://${env.CLOUDFRONT_PUBLIC_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
};

const getPostDistributionDomainUrlForObject = (objectKey: string) => {
  return `https://${env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
};

const getProfileDistributionDomainUrlForObject = (objectKey: string) => {
  return `https://${env.CLOUDFRONT_PROFILE_DISTRIBUTION_DOMAIN}/${objectKey}`;
};

export const cloudfront = {
  client,

  async getSignedUrl({ url }: { url: string }): Promise<string> {
    return getSignedUrl({
      url,
      keyPairId: env.CLOUDFRONT_PUBLIC_KEY_ID,
      privateKey: env.CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: new Date(Date.now() + ONE_HOUR).toISOString(),
    }) as unknown as Promise<string>;
  },

  async createInvalidation(distributionId: string, objectPattern: string) {
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

    await client.send(command);
  },

  getPublicPostUrl: getPublicPostDistributionDomainUrlForObject,
  getPrivatePostUrl: getPostDistributionDomainUrlForObject,
  getProfilePictureUrl: getProfileDistributionDomainUrlForObject,
};

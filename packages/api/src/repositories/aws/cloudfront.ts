import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import { cloudfront } from "@oppfy/cloudfront";
import { env } from "@oppfy/env";

import { handleAwsErrors } from "../../errors";

const ONE_HOUR = 60 * 60 * 1000;

export class CloudFrontRepository {
  private cloudFrontClient = cloudfront;

  @handleAwsErrors
  getSignedUrl({ url }: { url: string }) {
    return getSignedUrl({
      url,
      keyPairId: env.CLOUDFRONT_PUBLIC_KEY_ID,
      privateKey: env.CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: new Date(Date.now() + ONE_HOUR).toISOString(),
    });
  }

  @handleAwsErrors
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

    await this.cloudFrontClient.send(command);
  }
}

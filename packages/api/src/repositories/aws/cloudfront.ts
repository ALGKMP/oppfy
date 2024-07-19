import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import { env } from "@oppfy/env";

import { handleAwsErrors } from "../../errors";

export class CloudFrontRepository {
  @handleAwsErrors
  async getSignedUrl({ url }: { url: string }) {
    const signedUrl = await getSignedUrl({
      url,
      keyPairId: env.CLOUDFRONT_PUBLIC_KEY_ID,
      privateKey: env.CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour btw
    });
    return signedUrl;
  }
}

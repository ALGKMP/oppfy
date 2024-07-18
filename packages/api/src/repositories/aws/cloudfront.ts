import { getSignedUrl } from "@aws-sdk/cloudfront-signer"; // ESM

const cloudfrontDistributionDomain = "https://d111111abcdef8.cloudfront.net";
const s3ObjectKey = "private-content/private.jpeg";
const url = `${cloudfrontDistributionDomain}/${s3ObjectKey}`;
const privateKey = "CONTENTS-OF-PRIVATE-KEY";
const keyPairId = "PUBLIC-KEY-ID-OF-CLOUDFRONT-KEY-PAIR";
const dateLessThan = "2022-01-01"; // any Date constructor compatible

export class CloudFrontRepository {
  getSignedUrl() {
    return getSignedUrl({
      url,
      keyPairId,
      dateLessThan,
      privateKey,
    });
  }
}

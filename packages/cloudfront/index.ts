import { CloudFrontClient } from "@aws-sdk/client-cloudfront";

import { env } from "@oppfy/env";

export const cloudfront = new CloudFrontClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

import { SNSClient } from "@aws-sdk/client-sns";

import { env } from "@oppfy/env/server";

export { PublishCommand } from "@aws-sdk/client-sns";

export const sns = new SNSClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

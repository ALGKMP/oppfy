declare global {
  //   eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      AWS_REGION: string;
      AWS_ACCOUNT_ID: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;

      SNS_PUSH_NOTIFICATION_TOPIC_ARN: string;

      SQS_CONTACT_QUEUE: string;

      S3_POST_BUCKET: string;
      S3_PROFILE_BUCKET: string;

      MUX_TOKEN_ID: string;
      MUX_TOKEN_SECRET: string;
      MUX_WEBHOOK_SECRET: string;

      DATABASE_PORT: string;
      DATABASE_ENDPOINT: string;
      DATABASE_USERNAME: string;
      DATABASE_NAME: string;
      DATABASE_PASSWORD: string;

      OPENSEARCH_URL: string;

      EXPO_ACCESS_TOKEN: string;

      CONTACT_REC_LAMBDA_URL: string;

      EXPO_PUBLIC_API_URL: string;
    }
  }
}

export const env: NodeJS.ProcessEnv = process.env;

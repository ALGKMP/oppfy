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
      DATABASE_URL: string;

      OPENSEARCH_URL: string;

      EXPO_ACCESS_TOKEN: string;

      CONTACT_REC_LAMBDA_URL: string;

      EXPO_PUBLIC_API_URL: string;

      CLOUDFRONT_PUBLIC_KEY: string;
      CLOUDFRONT_PUBLIC_KEY_ID: string;
      CLOUDFRONT_PROFILE_DISTRIBUTION_ID: string;
      CLOUDFRONT_PRIVATE_KEY: string;
      CLOUDFRONT_PUBLIC_POSTS_DISTRIBUTION_DOMAIN: string;
      CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_DOMAIN: string;
      CLOUDFRONT_PROFILE_DISTRIBUTION_DOMAIN: string;
    }
  }
}

export const env: NodeJS.ProcessEnv = process.env;

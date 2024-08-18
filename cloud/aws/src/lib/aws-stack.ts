import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

import { env } from "@oppfy/env";

import { Bucket } from "./constructs/bucket";
import { CloudFrontDistribution } from "./constructs/cloudfront";
import { Database } from "./constructs/database";
import { LambdaFunction } from "./constructs/lambda";
import { Neptune } from "./constructs/neptune";
import { OpenSearch } from "./constructs/opensearch";
import { Queue } from "./constructs/queue";
import { SNSTopic } from "./constructs/sns";

const environment = {
  SNS_PUSH_NOTIFICATION_TOPIC_ARN: env.SNS_PUSH_NOTIFICATION_TOPIC_ARN,

  S3_POST_BUCKET: env.S3_POST_BUCKET,
  S3_PROFILE_BUCKET: env.S3_PROFILE_BUCKET,

  MUX_TOKEN_ID: env.MUX_TOKEN_ID,
  MUX_TOKEN_SECRET: env.MUX_TOKEN_SECRET,
  MUX_WEBHOOK_SECRET: env.MUX_WEBHOOK_SECRET,

  DATABASE_PORT: env.DATABASE_PORT,
  DATABASE_ENDPOINT: env.DATABASE_ENDPOINT,
  DATABASE_USERNAME: env.DATABASE_USERNAME,
  DATABASE_NAME: env.DATABASE_NAME,
  DATABASE_PASSWORD: env.DATABASE_PASSWORD,
  DATABASE_URL: env.DATABASE_URL,

  OPENSEARCH_URL: env.OPENSEARCH_URL,

  SQS_CONTACT_QUEUE: env.SQS_CONTACT_QUEUE,

  AWS_ACCOUNT_ID: env.AWS_ACCOUNT_ID,

  CONTACT_REC_LAMBDA_URL: env.CONTACT_REC_LAMBDA_URL,

  EXPO_ACCESS_TOKEN: env.EXPO_ACCESS_TOKEN,
  CLOUDFRONT_PROFILE_DISTRIBUTION_ID: env.CLOUDFRONT_PROFILE_DISTRIBUTION_ID,
};

export class AwsStack extends cdk.Stack {
  private setupBucketLambdaIntegration(
    bucket: s3.Bucket,
    lambdaFunction: LambdaFunction,
    permissionId: string,
  ) {
    bucket.grantRead(lambdaFunction.function);
    lambdaFunction.function.addPermission(permissionId, {
      action: "lambda:InvokeFunction",
      principal: new iam.ServicePrincipal("s3.amazonaws.com"),
      sourceArn: bucket.bucketArn,
    });
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaFunction.function),
    );
  }

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: env.AWS_ACCOUNT_ID,
        region: env.AWS_REGION,
      },
      ...props,
    });

    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: "Public",
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name: "Private",
          cidrMask: 24,
        },
      ],
    });

    const _database = new Database(this, "Database", vpc);
    const _openSearch = new OpenSearch(this, "OpenSearch", vpc);
    const neptune = new Neptune(this, "Neptune", vpc);

    const postBucket = new Bucket(this, "PostBucket");
    const profileBucket = new Bucket(this, "ProfileBucket");

    const accessControlLambda = new LambdaFunction(
      this,
      "AccessControlLambda",
      {
        entry: "src/res/lambdas/access-control/index.ts",
      },
    );

    const accessControlLambdaVersion =
      accessControlLambda.function.currentVersion;

    const publicKey = new cloudfront.PublicKey(this, "CloudFrontPublicKey", {
      encodedKey: env.CLOUDFRONT_PUBLIC_KEY,
      comment: "Key for signing CloudFront URLs",
    });

    const keyGroup = new cloudfront.KeyGroup(this, "CloudFrontKeyGroup", {
      items: [publicKey],
    });

    const oai = new cloudfront.OriginAccessIdentity(this, "CloudFrontOAI");
    profileBucket.bucket.grantRead(oai);

    const publicPostDistribution = new CloudFrontDistribution(
      this,
      "PublicPostDistribution",
      {
        isPrivate: false,
        bucket: postBucket.bucket,
        accessControlLambda: accessControlLambdaVersion,
        oai,
      },
    );

    const privatePostDistribution = new CloudFrontDistribution(
      this,
      "PrivatePostDistribution",
      {
        isPrivate: true,
        bucket: postBucket.bucket,
        oai,
        keyGroup,
      },
    );

    const profileDistribution = new CloudFrontDistribution(
      this,
      "ProfileDistribution",
      {
        isPrivate: true,
        bucket: profileBucket.bucket,
        oai,
        keyGroup,
      },
    );

    const postLambda = new LambdaFunction(this, "PostLambda", {
      entry: "src/res/lambdas/posts/index.ts",
      environment,
    });

    const profileLambda = new LambdaFunction(this, "ProfileLambda", {
      entry: "src/res/lambdas/profile-picture/index.ts",
      environment,
    });

    profileLambda.function.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cloudfront:CreateInvalidation"],
        resources: [
          `arn:aws:cloudfront::${env.AWS_ACCOUNT_ID}:distribution/${env.CLOUDFRONT_PROFILE_DISTRIBUTION_ID}`,
        ],
      }),
    );

    this.setupBucketLambdaIntegration(
      postBucket.bucket,
      postLambda,
      "AllowPostS3Invocation",
    );
    this.setupBucketLambdaIntegration(
      profileBucket.bucket,
      profileLambda,
      "AllowProfileS3Invocation",
    );

    const muxWebhookLambda = new LambdaFunction(this, "MuxWebhookLambda", {
      entry: "src/res/lambdas/mux/index.ts",
      environment,
    });

    const muxWebhookUrl = muxWebhookLambda.function.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      "LambdaSecurityGroup",
      {
        vpc,
        description: "Security group for Lambda functions",
        allowAllOutbound: true,
      },
    );

    neptune.cluster.connections.allowFrom(
      lambdaSecurityGroup,
      ec2.Port.tcp(8182),
    );

    const contactRecLambda = new LambdaFunction(this, "ContactRecLambda", {
      entry: "src/res/lambdas/contact-recs/index.ts",
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment,
    });

    const contactRecLambdaUrl = contactRecLambda.function.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    const contactSyncLambda = new LambdaFunction(this, "ContactSyncLambda", {
      entry: "src/res/lambdas/contact-sync/index.ts",
      vpc,
      securityGroups: [lambdaSecurityGroup],
      environment,
    });

    const contactSyncQueue = new Queue(this, "ContactSync");

    contactSyncQueue.queue.grantSendMessages(contactSyncLambda.function);
    contactSyncQueue.deadLetterQueue.grantSendMessages(
      contactSyncLambda.function,
    );

    contactSyncLambda.function.addEventSource(
      new SqsEventSource(contactSyncQueue.queue, {
        batchSize: 1,
      }),
    );

    const pushNotificationsLambda = new LambdaFunction(
      this,
      "PushNotificationsLambda",
      {
        entry: "src/res/lambdas/push-notifications/index.ts",
        environment,
      },
    );

    const pushNotificationsTopic = new SNSTopic(
      this,
      "PushNotifications",
      pushNotificationsLambda.function,
    );

    pushNotificationsTopic.topic.grantPublish(postLambda.function);
    pushNotificationsTopic.topic.grantPublish(muxWebhookLambda.function);

    new ssm.StringParameter(this, "DbConfigParameter", {
      parameterName: "/oppfy/db-config",
      stringValue: JSON.stringify({
        host: env.DATABASE_ENDPOINT,
        port: env.DATABASE_PORT,
        database: env.DATABASE_NAME,
        user: env.DATABASE_USERNAME,
        password: env.DATABASE_PASSWORD,
      }),
      tier: ssm.ParameterTier.STANDARD,
      description: "Database configuration for the application",
    });

    const ssmParameterArn = ssm.StringParameter.fromStringParameterName(
      this,
      "DbConfigParameterArn",
      "/oppfy/db-config",
    ).parameterArn;

    accessControlLambda.function.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [ssmParameterArn],
      }),
    );

    // Outputs
    new cdk.CfnOutput(this, "PublicPostDistributionUrl", {
      value: `https://${publicPostDistribution.distribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, "PrivatePostDistributionUrl", {
      value: `https://${privatePostDistribution.distribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, "ProfileDistributionUrl", {
      value: `https://${profileDistribution.distribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, "MuxWebhookUrl", {
      value: muxWebhookUrl.url,
    });

    new cdk.CfnOutput(this, "ContactRecLambdaUrl", {
      value: contactRecLambdaUrl.url,
    });

    new cdk.CfnOutput(this, "ContactSyncQueueUrl", {
      value: contactSyncQueue.queue.queueUrl,
    });

    new cdk.CfnOutput(this, "PushNotificationsTopicArn", {
      value: pushNotificationsTopic.topic.topicArn,
    });
  }
}

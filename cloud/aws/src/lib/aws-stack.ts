import * as neptune from "@aws-cdk/aws-neptune-alpha";
import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";

import { env } from "@oppfy/env";

// Helper function to create a Lambda function
function createLambdaFunction(
  scope: Construct,
  name: string,
  entryPath: string,
) {
  return new lambdaNodeJs.NodejsFunction(scope, name, {
    runtime: lambda.Runtime.NODEJS_20_X,
    entry: entryPath,
    handler: "handler",
    timeout: cdk.Duration.minutes(3),
    bundling: {
      format: lambdaNodeJs.OutputFormat.ESM, // Use ESM format for bundling
      mainFields: ["module", "main"],
      esbuildArgs: {
        "--platform": "node",
        "--target": "esnext", // Ensure es2020 or higher to support top-level await
        "--format": "esm", // Bundle as ESM
        "--banner:js":
          "import { createRequire } from 'module'; const require = createRequire(import.meta.url);", // Inject require shim
      },
    },
    environment: {
      // TODO: These should be passed on a case by case basis
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
      CLOUDFRONT_PROFILE_DISTRIBUTION_ID:
        env.CLOUDFRONT_PROFILE_DISTRIBUTION_ID,
    },
  });
}

function createLambdaFunctionWithVpc(
  scope: Construct,
  name: string,
  entryPath: string,
  vpc: ec2.Vpc,
  securityGroups?: ec2.SecurityGroup[],
) {
  return new lambdaNodeJs.NodejsFunction(scope, name, {
    runtime: lambda.Runtime.NODEJS_20_X,
    entry: entryPath,
    handler: "handler",
    timeout: cdk.Duration.minutes(3),
    bundling: {
      format: lambdaNodeJs.OutputFormat.ESM, // Use ESM format for bundling
      mainFields: ["module", "main"],
      esbuildArgs: {
        "--platform": "node",
        "--target": "esnext", // Ensure es2020 or higher to support top-level await
        "--format": "esm", // Bundle as ESM
        "--banner:js":
          "import { createRequire } from 'module'; const require = createRequire(import.meta.url);", // Inject require shim
      },
    },
    environment: {
      // TODO: These should be passed on a case by case basis
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
    },
    vpc,
    securityGroups,
  });
}

// Helper function to set up bucket and Lambda integration
function setupBucketLambdaIntegration(
  bucket: s3.Bucket,
  lambdaFunction: lambdaNodeJs.NodejsFunction,
  permissionId: string,
) {
  bucket.grantRead(lambdaFunction);
  lambdaFunction.addPermission(permissionId, {
    action: "lambda:InvokeFunction",
    principal: new iam.ServicePrincipal("s3.amazonaws.com"),
    sourceArn: bucket.bucketArn,
  });
  bucket.addEventNotification(
    s3.EventType.OBJECT_CREATED,
    new s3n.LambdaDestination(lambdaFunction),
  );
}

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: env.AWS_ACCOUNT_ID,
        region: env.AWS_REGION,
      },
      ...props,
    });

    const vpc = new ec2.Vpc(this, "MyVpc", {
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

    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      "PostgressSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
        description: "Security group for RDS PostgreSQL instance",
      },
    );

    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access from any IPv4 address",
    );

    const dbCredentialsSecret = new secretsmanager.Secret(
      this,
      "PostgressCredentialsSecret",
      {
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: "oppfy_db" }),
          generateStringKey: "password",
          passwordLength: 16,
          excludeCharacters: '"@/\\;:%+`?[]{}()<>|~!#$^&*_=',
        },
      },
    );

    const _rdsInstance = new rds.DatabaseInstance(this, "PostgresInstance", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      publiclyAccessible: true,
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      databaseName: "mydatabase",
      allocatedStorage: 20,
      maxAllocatedStorage: 20,
      backupRetention: cdk.Duration.days(1),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const postBucket = new s3.Bucket(this, "Post", {
      versioned: true,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"],
          exposedHeaders: [],
          maxAge: 3000,
        },
      ],
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const profileBucket = new s3.Bucket(this, "Profile", {
      versioned: true,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"],
          exposedHeaders: [],
          maxAge: 3000,
        },
      ],
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create a public key
    const publicKey = new cloudfront.PublicKey(this, "MyPublicKey", {
      encodedKey: env.CLOUDFRONT_PUBLIC_KEY,
      comment: "Key for signing CloudFront URLs",
    });

    // Create a key group
    const cfKeyGroup = new cloudfront.KeyGroup(this, "MyKeyGroup", {
      items: [publicKey],
    });

    // Lambda@Edge for access control
    const accessControlLambda = new lambdaNodeJs.NodejsFunction(
      this,
      "AccessControlLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: "src/res/lambdas/access-control/index.ts",
        handler: "handler",
        bundling: {
          format: lambdaNodeJs.OutputFormat.ESM, // Use ESM format for bundling
          mainFields: ["module", "main"],
          esbuildArgs: {
            "--platform": "node",
            "--target": "esnext", // Ensure es2020 or higher to support top-level await
            "--format": "esm", // Bundle as ESM
            "--banner:js":
              "import { createRequire } from 'module'; const require = createRequire(import.meta.url);", // Inject require shim
          },
        },
      },
    );

    // Grant the Lambda function permissions to access S3 and RDS
    postBucket.grantRead(accessControlLambda);
    profileBucket.grantRead(accessControlLambda);

    // Create a version for the Lambda function (required for Lambda@Edge)
    const accessControlLambdaVersion = new lambda.Version(
      this,
      "AccessControlLambdaVersion",
      {
        lambda: accessControlLambda,
      },
    );

    // CloudFront setup
    const cloudfrontOriginAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "CloudFrontOAI",
    );

    // CloudFront distribution for post bucket
    const postDistribution = new cloudfront.Distribution(
      this,
      "PostDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(postBucket, {
            originAccessIdentity: cloudfrontOriginAccessIdentity,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          trustedKeyGroups: [cfKeyGroup],
          edgeLambdas: [
            {
              functionVersion: accessControlLambdaVersion,
              eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            },
          ],
        },
      },
    );

    // CloudFront distribution for profile bucket
    const profileDistribution = new cloudfront.Distribution(
      this,
      "ProfileDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(profileBucket, {
            originAccessIdentity: cloudfrontOriginAccessIdentity,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          edgeLambdas: [
            {
              functionVersion: accessControlLambdaVersion,
              eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            },
          ],
        },
      },
    );

    new cdk.CfnOutput(this, "PostDistributionUrl", {
      value: `https://${postDistribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, "ProfileDistributionUrl", {
      value: `https://${profileDistribution.distributionDomainName}`,
    });

    postBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [postBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId,
          ),
        ],
      }),
    );

    profileBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [profileBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId,
          ),
        ],
      }),
    );

    const openSearchSecurityGroup = new ec2.SecurityGroup(
      this,
      "MyOpenSearchSecurityGroup",
      {
        vpc,
        description: "Security group for Open Search Service",
        allowAllOutbound: true,
      },
    );

    const postLambda = createLambdaFunction(
      this,
      "postLambda",
      "src/res/lambdas/posts/index.ts",
    );

    const profileLambda = createLambdaFunction(
      this,
      "profileLambda",
      "src/res/lambdas/profile-picture/index.ts",
    );
    profileLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cloudfront:CreateInvalidation"],
        resources: [
          `arn:aws:cloudfront::${env.AWS_ACCOUNT_ID}:distribution/${env.CLOUDFRONT_PROFILE_DISTRIBUTION_ID}`,
        ],
      }),
    );

    const muxWebhookLambda = createLambdaFunction(
      this,
      "muxLambda",
      "src/res/lambdas/mux/index.ts",
    );

    const muxWebhookUrl = muxWebhookLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // We'll have our own auth
    });

    // Output the Lambda function URL
    new cdk.CfnOutput(this, "MuxWebhookUrl", {
      value: muxWebhookUrl.url,
    });

    setupBucketLambdaIntegration(
      postBucket,
      postLambda,
      "AllowPostS3Invocation",
    );
    setupBucketLambdaIntegration(
      profileBucket,
      profileLambda,
      "AllowProfileS3Invocation",
    );

    openSearchSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS access from any IPv4 address",
    );

    const openSearchDomain = new opensearch.Domain(this, "MyOpenSearchDomain", {
      domainName: "testing",
      version: opensearch.EngineVersion.OPENSEARCH_1_0,
      capacity: {
        masterNodes: 0,
        dataNodes: 1,
        dataNodeInstanceType: "t3.small.search",
        multiAzWithStandbyEnabled: false,
      },
      ebs: {
        enabled: true,
        volumeSize: 10,
        volumeType: ec2.EbsDeviceVolumeType.GENERAL_PURPOSE_SSD_GP3,
      },
      zoneAwareness: {
        enabled: false,
      },
      // Removed VPC and Subnet configurations
      securityGroups: [openSearchSecurityGroup],
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Grant Lambda permission to access OpenSearch
    const openSearchPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "es:ESHttpPost",
        "es:ESHttpGet",
        "es:ESHttpPut",
        "es:ESHttpDelete",
      ],
      resources: [
        openSearchDomain.domainArn,
        `${openSearchDomain.domainArn}/*`,
      ],
    });

    profileLambda.addToRolePolicy(openSearchPolicy);

    // Output the OpenSearch domain endpoint
    new cdk.CfnOutput(this, "OpenSearchDomainEndpoint", {
      value: openSearchDomain.domainEndpoint,
    });

    const neptuneSecurityGroup = new ec2.SecurityGroup(
      this,
      "MyNeptuneSecurityGroup",
      {
        vpc,
        description: "Security group for Neptune Service",
        allowAllOutbound: true,
      },
    );

    neptuneSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8182),
      "Allow Gremlin access from any IPv4 address",
    );

    const cluster = new neptune.DatabaseCluster(this, "MyNeptuneCluster", {
      vpc,
      iamAuthentication: false,
      // instanceType: neptune.InstanceType.T3_MEDIUM,
      instanceType: neptune.InstanceType.SERVERLESS,
      serverlessScalingConfiguration: {
        minCapacity: 1,
        maxCapacity: 5,
      },
      engineVersion: neptune.EngineVersion.V1_3_0_0,
      securityGroups: [neptuneSecurityGroup],
    });

    // Output the Neptune cluster endpoint
    new cdk.CfnOutput(this, "NeptuneClusterReadEndpoint", {
      value: cluster.clusterReadEndpoint.hostname,
    });

    // Output the Neptune cluster endpoint
    new cdk.CfnOutput(this, "NeptuneClusterWriteEndpoint", {
      value: cluster.clusterEndpoint.hostname,
    });

    const contactRecLambda = createLambdaFunctionWithVpc(
      this,
      "contactRecLambda",
      "src/res/lambdas/contact-recs/index.ts",
      vpc,
      [neptuneSecurityGroup],
    );

    contactRecLambda.addEnvironment(
      "NEPTUNE_ENDPOINT",
      cluster.clusterReadEndpoint.socketAddress,
    );

    const contactRecLambdaUrl = contactRecLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new cdk.CfnOutput(this, "ContactRecLambdaUrl", {
      value: contactRecLambdaUrl.url,
    });

    const contactSyncLambda = createLambdaFunctionWithVpc(
      this,
      "contactSyncLambda",
      "src/res/lambdas/contact-sync/index.ts",
      vpc,
      [neptuneSecurityGroup],
    );

    contactSyncLambda.addEnvironment(
      "NEPTUNE_ENDPOINT",
      cluster.clusterEndpoint.socketAddress,
    );

    // setup sqs for neptune proxy lambda, good for one day for debugging
    const contactSyncDLQ = new sqs.Queue(this, "ContactSyncDLQ", {
      retentionPeriod: cdk.Duration.days(1),
    });

    // real queue, 5 hours retention
    const contactSyncQueue = new sqs.Queue(this, "ContactSyncQueue", {
      queueName: "ContactSyncQueue",
      retentionPeriod: cdk.Duration.hours(5),
      // visibilityTimeout: cdk.Duration.minutes(3),
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: contactSyncDLQ,
      },
    });

    // setup neptune proxy lambda to listen to sqs
    contactSyncQueue.grantSendMessages(contactSyncLambda);
    contactSyncDLQ.grantSendMessages(contactSyncLambda);

    // setup neptune proxy lambda to write to sqs
    contactSyncLambda.addEventSource(
      new SqsEventSource(contactSyncQueue, {
        batchSize: 1,
      }),
    );

    // output sqs endpoint
    new cdk.CfnOutput(this, "ContactSyncQueueEndpoint", {
      value: contactSyncQueue.queueUrl,
    });

    /*  // user for debug notebook if someone wants to use that shit
    const neptuneNotebookRole = new iam.Role(this, "NeptuneNotebookRole", {
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
      description: "Role for neptune notebook",
    });

    neptuneNotebookRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject", "s3:ListBucket"],
        resources: [`*`],
      }),
    );

    const lifeCycleScript = `#!/bin/bash
sudo -u ec2-user -i <<'EOF'
echo "export GRAPH_NOTEBOOK_AUTH_MODE=DEFAULT" >> ~/.bashrc
echo "export GRAPH_NOTEBOOK_HOST=${cluster.clusterEndpoint.hostname}" >> ~/.bashrc
echo "export GRAPH_NOTEBOOK_PORT=8182" >> ~/.bashrc
echo "export NEPTUNE_LOAD_FROM_S3_ROLE_ARN=" >> ~/.bashrc
echo "export AWS_REGION=${this.region}" >> ~/.bashrc
aws s3 cp s3://aws-neptune-notebook/graph_notebook.tar.gz /tmp/graph_notebook.tar.gz
rm -rf /tmp/graph_notebook
tar -zxvf /tmp/graph_notebook.tar.gz -C /tmp
/tmp/graph_notebook/install.sh
EOF`;

    const notebookLifecycleConfig =
      new sagemaker.CfnNotebookInstanceLifecycleConfig(
        this,
        "NotebookLifecycleConfig",
        {
          notebookInstanceLifecycleConfigName:
            "neptune-notebook-lifecycle-config",
          onStart: [
            {
              content: cdk.Fn.base64(lifeCycleScript),
            },
          ],
        },
      );

    const notebookInstance = new sagemaker.CfnNotebookInstance(
      this,
      "NeptuneNotebookInstance",
      {
        notebookInstanceName: "neptune-notebook-test",
        subnetId: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnetIds[0],
        securityGroupIds: [neptuneSecurityGroup.securityGroupId],
        instanceType: "ml.t3.medium",
        roleArn: neptuneNotebookRole.roleArn,
        lifecycleConfigName:
          notebookLifecycleConfig.notebookInstanceLifecycleConfigName,
      },
    ); */

    const pushNotificationsLambda = createLambdaFunction(
      this,
      "pushNotificationsLambda",
      "src/res/lambdas/push-notifications/index.ts",
    );

    // Create an SNS topic
    const pushNotificationsTopic = new sns.Topic(
      this,
      "PushNotificationsTopic",
      {
        displayName: "Push Notifications Topic",
      },
    );

    // Subscribe the Lambda function to the SNS topic
    pushNotificationsTopic.addSubscription(
      new subs.LambdaSubscription(pushNotificationsLambda),
    );

    // Output the SNS Topic ARN
    new cdk.CfnOutput(this, "PushNotificationsTopicArn", {
      value: pushNotificationsTopic.topicArn,
    });
  }
}

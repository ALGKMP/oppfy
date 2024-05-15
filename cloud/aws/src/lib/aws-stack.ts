import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import * as dms from "aws-cdk-lib/aws-dms";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kinesis from "aws-cdk-lib/aws-kinesis";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import { CfnDomain } from "aws-cdk-lib/aws-opensearchservice";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

// Helper function to create an S3 bucket
function createBucket(scope: Construct, name: string) {
  return new s3.Bucket(scope, name, {
    versioned: true,
    cors: [
      {
        allowedHeaders: ["*"],
        allowedMethods: [
          s3.HttpMethods.PUT,
          s3.HttpMethods.POST,
          s3.HttpMethods.DELETE,
        ],
        allowedOrigins: ["*"],
        exposedHeaders: [],
        maxAge: 600,
      },
    ],
  });
}

// Helper function to create a Lambda function
function createLambdaFunction(scope, name, entryPath) {
  return new lambdaNodeJs.NodejsFunction(scope, name, {
    runtime: lambda.Runtime.NODEJS_20_X,
    entry: entryPath,
    handler: "handler",
    timeout: cdk.Duration.minutes(3),
    bundling: {
      format: lambdaNodeJs.OutputFormat.ESM,
      mainFields: ["module", "main"],
      esbuildArgs: {
        "--conditions": "module",
      },
    },
  });
}

// Helper function to set up bucket and Lambda integration
function setupBucketLambdaIntegration(bucket, lambdaFunction, permissionId) {
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
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION,
      },
      ...props,
    });

    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 2,
      natGateways: 1,
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

    const dbSecurityGroup = new ec2.SecurityGroup(this, "MyDbSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Security group for RDS DB instance",
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3306),
      "Allow MySQL access from any IPv4 address",
    );

    const dbCredentialsSecret = new secretsmanager.Secret(
      this,
      "DBCredentialsSecret",
      {
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: "oppfy_db",
          }),
          generateStringKey: "password",
          passwordLength: 16,
          excludeCharacters: '"@/\\;:%+`?[]{}()<>|~!#$^&*_=',
        },
      },
    );

    const mysqlParameterGroup = new rds.ParameterGroup(
      this,
      "MySqlParameterGroup",
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        parameters: {
          binlog_format: "ROW",
          binlog_checksum: "NONE",
          binlog_row_image: "FULL",
        },
      },
    );

    const rdsInstance = new rds.DatabaseInstance(
      this,
      "MyFreeTierRdsInstance",
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO,
        ),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        publiclyAccessible: true,
        securityGroups: [dbSecurityGroup],
        credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
        parameterGroup: mysqlParameterGroup,
        databaseName: "mydatabase",
        multiAz: false,
        allocatedStorage: 20,
        storageType: rds.StorageType.GP2,
        backupRetention: cdk.Duration.days(1),
        deletionProtection: false,
      },
    );

    const postBucket = createBucket(this, "Post");
    const profileBucket = createBucket(this, "Profile");

    const postLambda = createLambdaFunction(
      this,
      "postLambda",
      "src/res/lambdas/post/index.ts",
    );
    const profileLambda = createLambdaFunction(
      this,
      "profileLambda",
      "src/res/lambdas/profilePicture/index.ts",
    );

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

    const openSearchRole = new iam.Role(this, "OpenSearchRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      description: "Role for OpenSearch Service access",
    });

    openSearchRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["es:*"],
        resources: [`arn:aws:es:${this.region}:${this.account}:domain/test/*`],
      }),
    );

    const openSearchSecurityGroup = new ec2.SecurityGroup(
      this,
      "OpenSearchSecurityGroup",
      {
        vpc,
        description: "Security group for OpenSearch Service",
        allowAllOutbound: true,
      },
    );

    openSearchSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS access from any IPv4 address",
    );

    const openSearchDomain = new opensearch.Domain(this, "MyOpenSearchDomain", {
      domainName: "test",
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
      securityGroups: [openSearchSecurityGroup],
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.ArnPrincipal(openSearchRole.roleArn)],
          actions: ["es:*"],
          resources: [
            `arn:aws:es:${this.region}:${this.account}:domain/test/*`,
          ],
        }),
      ],
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, "OpenSearchDomainEndpoint", {
      value: openSearchDomain.domainEndpoint,
    });

    const dmsVpcRole = new iam.Role(this, "DmsVpcRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonDMSVPCManagementRole",
        ),
      ],
    });

    const dmsCloudWatchLogsRole = new iam.Role(this, "DmsCloudWatchLogsRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonDMSCloudWatchLogsRole",
        ),
      ],
    });

    const dmsSubnetGroup = new dms.CfnReplicationSubnetGroup(
      this,
      "DmsSubnetGroup",
      {
        replicationSubnetGroupIdentifier: "dms-subnet-group",
        replicationSubnetGroupDescription:
          "Subnet group for DMS replication instances",
        subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
      },
    );

    const dmsSecurityGroup = new ec2.SecurityGroup(this, "DmsSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Security group for DMS replication instance",
    });

    dmsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443), // Allow HTTPS outbound traffic
      "Allow HTTPS outbound traffic for Kinesis",
    );

    const dmsReplicationInstance = new dms.CfnReplicationInstance(
      this,
      "DmsReplicationInstance",
      {
        replicationInstanceClass: "dms.t2.micro",
        allocatedStorage: 50,
        publiclyAccessible: true, // Ensure the instance is publicly accessible
        vpcSecurityGroupIds: [dmsSecurityGroup.securityGroupId],
        replicationSubnetGroupIdentifier: dmsSubnetGroup.ref,
        multiAz: false,
      },
    );

    const dmsSourceEndpoint = new dms.CfnEndpoint(this, "DmsSourceEndpoint", {
      endpointType: "source",
      engineName: "mysql",
      username: cdk.Fn.sub(
        "{{resolve:secretsmanager:${MyDbSecret}:SecretString:username}}",
        {
          MyDbSecret: dbCredentialsSecret.secretArn,
        },
      ),
      password: cdk.Fn.sub(
        "{{resolve:secretsmanager:${MyDbSecret}:SecretString:password}}",
        {
          MyDbSecret: dbCredentialsSecret.secretArn,
        },
      ),
      serverName: rdsInstance.dbInstanceEndpointAddress,
      port: 3306,
      databaseName: "mydatabase",
      sslMode: "none",
    });

    const kinesisStream = new kinesis.Stream(this, "DmsKinesisStream", {
      shardCount: 1,
    });

    const dmsKinesisRole = new iam.Role(this, "DmsKinesisRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      inlinePolicies: {
        KinesisAccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "kinesis:DescribeStream",
                "kinesis:PutRecord",
                "kinesis:PutRecords",
              ],
              resources: [kinesisStream.streamArn],
            }),
          ],
        }),
      },
    });

    const dmsTargetEndpoint = new dms.CfnEndpoint(this, "DmsTargetEndpoint", {
      endpointIdentifier: "DmsKinesisEndpoint",
      endpointType: "target",
      engineName: "kinesis",
      kinesisSettings: {
        messageFormat: "json-unformatted", // Ensure correct message format
        serviceAccessRoleArn: dmsKinesisRole.roleArn,
        streamArn: kinesisStream.streamArn,
      },
    });

    const tableMappings = JSON.stringify({
      rules: [
        {
          "rule-type": "selection",
          "rule-id": "1",
          "rule-name": "SelectUserTable",
          "object-locator": {
            "schema-name": "mydatabase",
            "table-name": "User",
          },
          "rule-action": "include",
        },
        {
          "rule-type": "selection",
          "rule-id": "2",
          "rule-name": "SelectProfileTable",
          "object-locator": {
            "schema-name": "mydatabase",
            "table-name": "Profile",
          },
          "rule-action": "include",
        },
        {
          "rule-type": "selection",
          "rule-id": "3",
          "rule-name": "SelectProfilePictureTable",
          "object-locator": {
            "schema-name": "mydatabase",
            "table-name": "ProfilePicture",
          },
          "rule-action": "include",
        },
        {
          "rule-type": "transformation",
          "rule-id": "4",
          "rule-name": "IncludeUserIdColumn",
          "rule-action": "include-column",
          "rule-target": "column",
          "object-locator": {
            "schema-name": "mydatabase",
            "table-name": "User",
            "column-name": "id",
          },
        },
        {
          "rule-type": "transformation",
          "rule-id": "5",
          "rule-name": "IncludeUsernameColumn",
          "rule-action": "include-column",
          "rule-target": "column",
          "object-locator": {
            "schema-name": "mydatabase",
            "table-name": "User",
            "column-name": "username",
          },
        },
        {
          "rule-type": "transformation",
          "rule-id": "6",
          "rule-name": "IncludeProfileIdColumn",
          "rule-action": "include-column",
          "rule-target": "column",
          "object-locator": {
            "schema-name": "mydatabase",
            "table-name": "User",
            "column-name": "profileId",
          },
        },
        {
          "rule-type": "transformation",
          "rule-id": "7",
          "rule-name": "IncludeFullNameColumn",
          "rule-action": "include-column",
          "rule-target": "column",
          "object-locator": {
            "schema-name": "mydatabase",
            "table-name": "Profile",
            "column-name": "fullName",
          },
        },
        {
          "rule-type": "transformation",
          "rule-id": "8",
          "rule-name": "IncludeProfilePictureIdColumn",
          "rule-action": "include-column",
          "rule-target": "column",
          "object-locator": {
            "schema-name": "mydatabase",
            "table-name": "Profile",
            "column-name": "profilePictureId",
          },
        },
      ],
    });

    const taskSettings = JSON.stringify({
      FullLoadSettings: {
        MaxFullLoadSubTasks: 8,
      },
      TargetMetadata: {
        ParallelLoadQueuesPerThread: 0,
        ParallelLoadThreads: 0,
        ParallelLoadBufferSize: 0,
        ParallelApplyBufferSize: 1000,
        ParallelApplyQueuesPerThread: 16,
        ParallelApplyThreads: 8,
      },
    });

    const dmsReplicationTask = new dms.CfnReplicationTask(
      this,
      "DmsReplicationTask",
      {
        replicationInstanceArn: dmsReplicationInstance.ref,
        sourceEndpointArn: dmsSourceEndpoint.ref,
        targetEndpointArn: dmsTargetEndpoint.ref,
        migrationType: "full-load-and-cdc",
        tableMappings: tableMappings,
        replicationTaskSettings: taskSettings,
      },
    );

    const kinesisLambda = new lambdaNodeJs.NodejsFunction(
      this,
      "KinesisLambdaFunction",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        entry: "src/res/lambdas/kinesisHandler/index.ts",
        handler: "handler",
        environment: {
          REGION: this.region,
          DOMAIN_ENDPOINT: `https://${openSearchDomain.domainEndpoint}`,
          INDEX_NAME: "users",
        },
      },
    );

    kinesisLambda.addEventSource(
      new lambdaEventSources.KinesisEventSource(kinesisStream, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 100,
      }),
    );

    kinesisStream.grantRead(kinesisLambda);
    kinesisLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["es:ESHttpPost", "es:ESHttpPut", "es:ESHttpDelete"],
        resources: [`arn:aws:es:${this.region}:${this.account}:domain/test/*`],
      }),
    );

    new cdk.CfnOutput(this, "ReplicationTaskArn", {
      value: dmsReplicationTask.ref,
    });

    new cdk.CfnOutput(this, "KinesisStreamArn", {
      value: kinesisStream.streamArn,
    });

    new cdk.CfnOutput(this, "LambdaFunctionArn", {
      value: kinesisLambda.functionArn,
    });
  }
}

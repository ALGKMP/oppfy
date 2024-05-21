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
      DATABASE_PORT: process.env.DATABASE_PORT!,
      DATABASE_ENDPOINT: process.env.DATABASE_ENDPOINT!,
      DATABASE_USERNAME: process.env.DATABASE_USERNAME!,
      DATABASE_NAME: process.env.DATABASE_NAME!,
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD!,

      MUX_TOKEN_ID: process.env.MUX_TOKEN_ID!,
      MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET!,
      MUX_WEBHOOK_SECRET: process.env.MUX_WEBHOOK_SECRET!,
    },
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
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION,
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
      "src/res/lambdas/posts/index.ts",
    );
    const profileLambda = createLambdaFunction(
      this,
      "profileLambda",
      "src/res/lambdas/profile-picture/index.ts",
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

    // Define a security group for OpenSearch access
    const openSearchRole = new iam.Role(this, "DMSAccessRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      description: "Role for OpenSearch Service access",
    });

    openSearchRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["es:*"],
        resources: [
          `arn:aws:es:${this.region}:${this.account}:domain/testing/*`,
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
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.ArnPrincipal(openSearchRole.roleArn)],
          actions: ["es:*"],
          resources: [
            `arn:aws:es:${this.region}:${this.account}:domain/testing/*`,
          ],
        }),
      ],
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Output the OpenSearch domain endpoint
    new cdk.CfnOutput(this, "OpenSearchDomainEndpoint", {
      value: openSearchDomain.domainEndpoint,
    });

    // TODO: dms depends on this task - we need to wait for it to be created
    // Create the IAM role for DMS VPC management
    const _dmsVpcRole = new iam.Role(this, "DmsVpcRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      roleName: "dms-vpc-role",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonDMSVPCManagementRole",
        ),
      ],
    });

    // ! IF YOU RUN INTO A dms-vpc-role DOESNT EXIST ERROR:
    // ! 1. COMMENT ALL CODE BELOW
    // ! 2. RUN cdk deploy
    // ! 3. UNCOMMENT ALL CODE BELOW
    // ! 4. RUN cdk deploy

    // Create the IAM role for DMS CloudWatch Logs
    const _dmsCloudWatchLogsRole = new iam.Role(this, "DmsCloudWatchLogsRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      roleName: "dms-cloudwatch-logs-role",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonDMSCloudWatchLogsRole",
        ),
      ],
    });

    // Define the replication subnet group using the VPC's private subnets
    const dmsSubnetGroup = new dms.CfnReplicationSubnetGroup(
      this,
      "DmsSubnetGroup",
      {
        replicationSubnetGroupIdentifier: "dms-subnet-group", // Unique identifier
        replicationSubnetGroupDescription:
          "Subnet group for DMS replication instances",
        subnetIds: vpc.publicSubnets.map((subnet) => subnet.subnetId),
      },
    );

    // Define a security group for the RDS instance within the VPC
    const dmsSecurityGroup = new ec2.SecurityGroup(this, "MyDmsSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description: "Security group for DMS replication instance",
    });

    // Create the DMS replication instance
    const dmsReplicationInstance = new dms.CfnReplicationInstance(
      this,
      "MyDmsReplicationInstance",
      {
        replicationInstanceClass: "dms.t2.micro",
        allocatedStorage: 50,
        publiclyAccessible: true,
        // vpcSecurityGroupIds: [dmsSecurityGroup.securityGroupId],
        // replicationSubnetGroupIdentifier:
        //   dmsSubnetGroup.replicationSubnetGroupIdentifier,
        multiAz: false,
      },
    );

    const dmsSourceEndpoint = new dms.CfnEndpoint(this, "MyDmsSourceEndpoint", {
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
      port: 3306, // MySQL's default port
      databaseName: "mydatabase",
      sslMode: "none",
    });

    // DMS Target Endpoint for OpenSearch
    const dmsTargetEndpoint = new dms.CfnEndpoint(this, "MyDmsTargetEndpoint", {
      endpointType: "target",
      engineName: "opensearch",
      elasticsearchSettings: {
        serviceAccessRoleArn: openSearchRole.roleArn,
        endpointUri: openSearchDomain.domainEndpoint,
      },
    });

    const tableMappings = JSON.stringify({
      rules: [
        // Rule to select the Profile table
        {
          "rule-type": "selection",
          "rule-id": "1",
          "rule-name": "SelectProfileTable",
          "object-locator": {
            "schema-name": "mydatabase",
            "table-name": "Profile",
          },
          "rule-action": "include",
        },
      ],
    });

    // Create the DMS replication task
    const dmsReplicationTask = new dms.CfnReplicationTask(
      this,
      "MyDmsReplicationTask",
      {
        replicationInstanceArn: dmsReplicationInstance.ref, // ARN of the replication instance
        sourceEndpointArn: dmsSourceEndpoint.ref, // ARN of the source endpoint
        targetEndpointArn: dmsTargetEndpoint.ref, // ARN of the target endpoint
        migrationType: "full-load-and-cdc", // Perform full load and then replicate ongoing changes
        tableMappings: tableMappings, // Use the table mappings defined above
        replicationTaskSettings: JSON.stringify({
          TargetMetadata: {
            TargetSchema: "",
            SupportLobs: true, // Enable LOB support
            FullLobMode: true, // Set to true to include entire LOB in the migration
            LobChunkSize: 64, // Size in KB of LOB chunks
            LimitedSizeLobMode: false, // Set to false if FullLobMode is true
            LobMaxSize: 32, // Maximum size in KB for LOB columns (if LimitedSizeLobMode is true)
            InlineLobMaxSize: 0,
            LoadMaxFileSize: 0,
            ParallelLoadThreads: 0,
            BatchApplyEnabled: false,
          },
          FullLoadSettings: {
            FullLoadEnabled: true,
            ApplyChangesEnabled: true,
          },
          Logging: {
            EnableLogging: true,
          },
        }),
      },
    );

    // Output the replication task ARN
    new cdk.CfnOutput(this, "ReplicationTaskArn", {
      value: dmsReplicationTask.ref,
    });
  }
}

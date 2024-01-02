import * as cdk from "aws-cdk-lib";
import * as dms from "aws-cdk-lib/aws-dms";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVpc", { maxAzs: 2 });

    // Define a security group for the RDS instance within the VPC
    const dbSecurityGroup = new ec2.SecurityGroup(this, "MyDbSecurityGroup", {
      vpc,
      description: "Security group for RDS DB instance",
      allowAllOutbound: true,
    });

    // Allow inbound PostgreSQL connections on the default port (5432)
    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access from any IPv4 address",
    );

    // Create a secret for the RDS credentials
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
          excludeCharacters: '"@/\\', // Exclude characters that are not valid in a PostgreSQL password
        },
      },
    );

    new rds.DatabaseInstance(this, "MyFreeTierRdsInstance", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_12,
      }),
      databaseName: "mydatabase", // Specify the database name here
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      multiAz: false,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      backupRetention: cdk.Duration.days(0),
      deletionProtection: false,
    });

    const bucket = new s3.Bucket(this, "MyBucket", {
      versioned: true,
    });

    const myLambda = new lambda.Function(this, "MyLambdaFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("dist/res/lambda"),
      handler: "handler.handler",
    });

    // Grant the Lambda function permissions to be invoked by S3 events
    bucket.grantRead(myLambda);
    myLambda.addPermission("AllowS3Invocation", {
      action: "lambda:InvokeFunction",
      principal: new iam.ServicePrincipal("s3.amazonaws.com"),
      sourceArn: bucket.bucketArn,
    });

    // Add event notification to the bucket
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(myLambda),
    );

    // Define a security group for the RDS instance within the VPC
    const openSearchSecurityGroup = new ec2.SecurityGroup(
      this,
      "MyDbSecurityGroup",
      {
        vpc,
        description: "Security group for Open Search Service",
      },
    );

    const openSearchDomain = new opensearch.Domain(this, "MyOpenSearchDomain", {
      domainName: "my-opensearch-domain",
      version: opensearch.EngineVersion.OPENSEARCH_1_0, // Specify the desired version
      capacity: {
        dataNodes: 1, // Number of data nodes
        multiAzWithStandbyEnabled: false,
        dataNodeInstanceType: "t3.small.search", // Choose the instance type
      },
      ebs: {
        enabled: true,
        volumeType: ec2.EbsDeviceVolumeType.GENERAL_PURPOSE_SSD_GP3,
        volumeSize: 10, // Set according to your needs within free tier limits
      },
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ["es:*"],
          resources: [
            "arn:aws:es:us-east-1:924061656603:domain/my-opensearch-domain/*",
          ],
        }),
      ],
      securityGroups: [openSearchSecurityGroup],
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
    });

    // // OpenSearch Service setup
    // const openSearchDomain = new opensearch.CfnDomain(
    //   this,
    //   "MyOpenSearchDomain",
    //   {
    //     domainName: "my-opensearch-domain",
    //     engineVersion: "OpenSearch_1.0", // Use the desired version
    //     clusterConfig: {
    //       instanceType: "t3.small.search", // Choose an instance type eligible for free tier if available
    //       instanceCount: 1,
    //     },
    //     ebsOptions: {
    //       ebsEnabled: true,
    //       volumeSize: 10, // Set according to your needs within free tier limits
    //     },
    //     accessPolicies: {
    //       Version: "2012-10-17",
    //       Statement: [
    //         {
    //           Effect: "Allow",
    //           Principal: {
    //             AWS: "*",
    //           },
    //           Action: "es:*",
    //           Resource:
    //             "arn:aws:es:region:account:domain/my-opensearch-domain/*",
    //         },
    //       ],
    //     },
    //     nodeToNodeEncryptionOptions: {
    //       enabled: true,
    //     },
    //     encryptionAtRestOptions: {
    //       enabled: true,
    //     },
    //   },
    // );

    // // IAM Role for DMS - This role is automatically used by DMS
    // const dmsRole = new iam.Role(this, "DmsServiceRole", {
    //   assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
    //   managedPolicies: [
    //     iam.ManagedPolicy.fromAwsManagedPolicyName(
    //       "service-role/AmazonDMSVPCManagementRole",
    //     ),
    //   ],
    // });

    // // DMS Replication Instance
    // const dmsReplicationInstance = new dms.CfnReplicationInstance(
    //   this,
    //   "MyDmsReplicationInstance",
    //   {
    //     replicationInstanceClass: "dms.t2.micro",
    //     vpcSecurityGroupIds: [dbSecurityGroup.securityGroupId],
    //     replicationSubnetGroupIdentifier: new dms.CfnReplicationSubnetGroup(
    //       this,
    //       "MyDmsSubnetGroup",
    //       {
    //         replicationSubnetGroupDescription: "Subnet group for DMS",
    //         subnetIds: vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC })
    //           .subnetIds,
    //       },
    //     ).replicationSubnetGroupIdentifier,
    //     publiclyAccessible: true,
    //   },
    // );

    // // DMS Source Endpoint
    // const dmsSourceEndpoint = new dms.CfnEndpoint(this, "MyDmsSourceEndpoint", {
    //   endpointType: "source",
    //   engineName: "postgres",
    //   // Use secret ARN directly instead of exposing values
    //   username: dbCredentialsSecret.secretArn,
    //   password: dbCredentialsSecret.secretArn,
    //   serverName: "<RDS_INSTANCE_ENDPOINT>", // Replace with actual endpoint
    //   port: 5432,
    //   databaseName: "mydatabase",
    //   sslMode: "require",
    // });

    // // DMS Target Endpoint
    // const dmsTargetEndpoint = new dms.CfnEndpoint(this, "MyDmsTargetEndpoint", {
    //   endpointType: "target",
    //   engineName: "opensearch",
    //   serverName: openSearchDomain.attrDomainEndpoint,
    //   sslMode: "none", // Change if SSL is configured for OpenSearch
    // });

    // const dmsReplicationTask = new dms.CfnReplicationTask(
    //   this,
    //   "MyDmsReplicationTask",
    //   {
    //     migrationType: "full-load-and-cdc",
    //     sourceEndpointArn: dmsSourceEndpoint.ref,
    //     targetEndpointArn: dmsTargetEndpoint.ref,
    //     replicationInstanceArn: dmsReplicationInstance.ref,
    //     tableMappings: JSON.stringify({
    //       rules: [
    //         {
    //           "rule-type": "selection",
    //           "rule-id": "1",
    //           "rule-name": "1",
    //           "object-locator": {
    //             "schema-name": "public",
    //             "table-name": "User",
    //           },
    //           "rule-action": "include",
    //           filters: [],
    //         },
    //         {
    //           "rule-type": "transformation",
    //           "rule-id": "2",
    //           "rule-name": "2",
    //           "rule-target": "column",
    //           "object-locator": {
    //             "schema-name": "public",
    //             "table-name": "User",
    //           },
    //           "rule-action": "map-record-to-record",
    //           "transformation-parameters": {
    //             "record-type": "json",
    //           },
    //         },
    //         // Add more rules for other tables like Post, Comment, etc. if needed
    //       ],
    //     }),
    //   },
    // );
  }
}

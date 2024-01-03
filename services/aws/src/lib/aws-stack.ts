import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
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

// ! Adhere to free tier specs
// https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 2,
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

    const rdsInstance = new rds.DatabaseInstance(
      this,
      "MyFreeTierRdsInstance",
      {
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
      },
    );

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
      "MyOpenSearchSecurityGroup",
      {
        vpc,
        description: "Security group for Open Search Service",
      },
    );

    const openSearchDomain = new opensearch.Domain(this, "MyOpenSearchDomain", {
      domainName: "my-opensearch-domain",
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
      vpc,
      vpcSubnets: [
        {
          subnets: [
            vpc.selectSubnets({
              subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            }).subnets[0],
          ],
        },
      ],
      securityGroups: [openSearchSecurityGroup],
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()], // This allows all AWS principals
          actions: ["es:*"],
          resources: [
            `arn:aws:es:${this.region}:${this.account}:domain/my-opensearch-domain/*`,
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

    // Create the IAM role for DMS VPC management
    const dmsVpcRole = new iam.Role(this, "DmsVpcRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      roleName: "dms-vpc-role", // This should match the name expected by DMS
    });

    // Attach the AWS managed policy for DMS VPC management to the role
    dmsVpcRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonDMSVPCManagementRole",
      ),
    );

    // Define the replication subnet group using the VPC's private subnets
    const dmsSubnetGroup = new dms.CfnReplicationSubnetGroup(
      this,
      "DmsSubnetGroup",
      {
        replicationSubnetGroupIdentifier: "dms-subnet-group", // Unique identifier
        replicationSubnetGroupDescription:
          "Subnet group for DMS replication instances",
        subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
      },
    );

    // Define the replication instance security group
    const dmsSecurityGroup = new ec2.SecurityGroup(this, "DmsSecurityGroup", {
      vpc,
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
        vpcSecurityGroupIds: [dbSecurityGroup.securityGroupId],
        replicationSubnetGroupIdentifier:
          dmsSubnetGroup.replicationSubnetGroupIdentifier,
        multiAz: false,
      },
    );

    const dmsSourceEndpoint = new dms.CfnEndpoint(this, "MyDmsSourceEndpoint", {
      endpointType: "source",
      engineName: "postgres",
      username: dbCredentialsSecret
        .secretValueFromJson("username")
        .unsafeUnwrap(),
      password: dbCredentialsSecret
        .secretValueFromJson("password")
        .unsafeUnwrap(),
      serverName: rdsInstance.dbInstanceEndpointAddress,
      port: 5432,
      databaseName: "mydatabase",
      sslMode: "require",
    });

    // IAM role for DMS to access OpenSearch
    const dmsAccessRole = new iam.Role(this, "DmsAccessRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonOpenSearchServiceFullAccess",
        ),
      ],
    });

    dmsAccessRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["es:ESHttp*"],
        resources: [`${openSearchDomain.domainArn}/*`],
      }),
    );

    // DMS Target Endpoint for OpenSearch
    const dmsTargetEndpoint = new dms.CfnEndpoint(this, "MyDmsTargetEndpoint", {
      endpointType: "target",
      engineName: "opensearch",
      elasticsearchSettings: {
        serviceAccessRoleArn: dmsAccessRole.roleArn,
        endpointUri: openSearchDomain.domainEndpoint,
      },
    });

    const tableMappings = JSON.stringify({
      rules: [
        {
          "rule-type": "selection",
          "rule-id": "1",
          "rule-name": "1",
          "object-locator": {
            "schema-name": "public", // Default schema for PostgreSQL
            "table-name": "User",
          },
          "rule-action": "include",
          filters: [],
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
          // Default task settings; adjust as needed
          TargetMetadata: {
            TargetSchema: "",
            SupportLobs: true,
            FullLobMode: false,
            LobChunkSize: 64,
            LimitedSizeLobMode: true,
            LobMaxSize: 32,
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
//   }
// }

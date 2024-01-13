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
      allowAllOutbound: true,
      description: "Security group for RDS DB instance",
    });

    // Allow inbound MySQL connections on the default port (3306)
    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3306),
      "Allow MySQL access from any IPv4 address",
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
          excludeCharacters: '"@/\\;:%+`?[]{}()<>|~!#$^&*_=',
        },
      },
    );

    // Create a new parameter group for MySQL
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

    // Create the RDS MySQL instance
    const rdsInstance = new rds.DatabaseInstance(
      this,
      "MyFreeTierRdsInstance",
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE2,
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

    const bucket = new s3.Bucket(this, "MyBucket", {
      versioned: true,
    });

    const myLambda = new lambda.Function(this, "MyLambdaFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("dist/res/lambdas/s3-one-time-use"),
      handler: "index.handler",
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

    // ! do not delete, this is used for testing
    // const bastionSecurityGroup = new ec2.SecurityGroup(
    //   this,
    //   "BastionSecurityGroup",
    //   {
    //     vpc,
    //     description: "Allow SSH access to Bastion Host",
    //     allowAllOutbound: true,
    //   },
    // );

    // // Allow inbound SSH connections on the default port (22)
    // bastionSecurityGroup.addIngressRule(
    //   ec2.Peer.anyIpv4(),
    //   ec2.Port.tcp(22),
    //   "Allow SSH access",
    // );

    // const bastionHostLinux = new ec2.BastionHostLinux(this, "BastionHost", {
    //   vpc,
    //   instanceType: ec2.InstanceType.of(
    //     ec2.InstanceClass.BURSTABLE3,
    //     ec2.InstanceSize.MICRO,
    //   ),
    //   securityGroup: bastionSecurityGroup,
    //   subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
    // });

    // // Display commands for connect bastion host using ec2 instance connect
    // const createSshKeyCommand = "ssh-keygen -t rsa -f my_rsa_key";
    // const pushSshKeyCommand = `aws ec2-instance-connect send-ssh-public-key --region ${cdk.Aws.REGION} --instance-id ${bastionHostLinux.instanceId} --availability-zone ${bastionHostLinux.instanceAvailabilityZone} --instance-os-user ec2-user --ssh-public-key file://my_rsa_key.pub --profile default`;
    // const sshCommand = `ssh -o "IdentitiesOnly=yes" -i my_rsa_key ec2-user@${bastionHostLinux.instancePublicDnsName}`;

    // new cdk.CfnOutput(this, "CreateSshKeyCommand", {
    //   value: createSshKeyCommand,
    // });
    // new cdk.CfnOutput(this, "PushSshKeyCommand", { value: pushSshKeyCommand });
    // new cdk.CfnOutput(this, "SshCommand", { value: sshCommand });

    // Define a security group for the RDS instance within the VPC
    const dmsAccessRole = new iam.Role(this, "DMSAccessRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      description: "Role for DMS to access OpenSearch Service",
    });

    dmsAccessRole.addToPolicy(
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

    const openSearchRole = new iam.Role(this, "OpenSearchRole", {
      assumedBy: new iam.ServicePrincipal("opensearchservice.amazonaws.com"),
      description: "Role for OpenSearch Service access",
    });

    // const openSearchAccessPolicy = new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   principals: [new iam.ArnPrincipal(openSearchRole.roleArn)],
    //   actions: ["es:*"],
    //   resources: [`arn:aws:es:${this.region}:${this.account}:domain/testing/*`],
    // });

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
          principals: [new iam.ArnPrincipal(dmsAccessRole.roleArn)],
          actions: ["es:*"],
          resources: [
            `arn:aws:es:${this.region}:${this.account}:domain/testing/*`,
          ],
        }),
        // Add additional policies if other services or users need access
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

    // // Define the IAM role for the Lambda function
    // const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
    //   assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    //   description: "Role for Lambda to access OpenSearch",
    // });

    // // Define a policy statement that allows specific actions on the OpenSearch domain
    // const policyStatement = new iam.PolicyStatement({
    //   actions: [
    //     "es:ESHttpGet",
    //     "es:ESHttpPut",
    //     "es:ESHttpPost",
    //     "es:ESHttpDelete",
    //   ],
    //   resources: [openSearchDomain.domainArn],
    // });

    // // Create a policy and attach the policy statement
    // const lambdaPolicy = new iam.Policy(this, "LambdaPolicy", {
    //   statements: [policyStatement],
    // });

    // // Attach the policy to the role
    // lambdaRole.attachInlinePolicy(lambdaPolicy);

    // // Add permissions for Lambda to write logs
    // lambdaRole.addManagedPolicy(
    //   iam.ManagedPolicy.fromAwsManagedPolicyName(
    //     "service-role/AWSLambdaBasicExecutionRole",
    //   ),
    // );

    // // Define the Lambda function
    // const lambdaFunction = new lambda.Function(this, "OpenSearchProxyLambda", {
    //   runtime: lambda.Runtime.NODEJS_20_X, // choose your desired Node.js runtime
    //   handler: "index.handler", // file is "index.js", function is "handler"
    //   code: lambda.Code.fromAsset("dist/res/lambdas/opensearch-proxy"),
    //   vpc: vpc, // deploy the Lambda in the same VPC as OpenSearch
    //   vpcSubnets: {
    //     subnets: vpc.selectSubnets({
    //       subnetType: ec2.SubnetType.PUBLIC, // Assuming OpenSearch is in a private subnet
    //     }).subnets,
    //   },
    //   role: lambdaRole,
    //   environment: {
    //     OPENSEARCH_DOMAIN_ENDPOINT: openSearchDomain.domainEndpoint, // Pass the OpenSearch endpoint to the Lambda
    //   },
    // });

    // // Grant the Lambda function read/write access to the OpenSearch domain
    // openSearchDomain.grantReadWrite(lambdaFunction);

    // TODO: dms depends on this task - we need to wait for it to be created
    // Create the IAM role for DMS VPC management
    const dmsVpcRole = new iam.Role(this, "DmsVpcRole", {
      assumedBy: new iam.ServicePrincipal("dms.amazonaws.com"),
      roleName: "dms-vpc-role",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonDMSVPCManagementRole",
        ),
      ],
    });

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
        subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
      },
    );

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
      engineName: "mysql", // Updated to MySQL
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
      port: 3306, // Updated to MySQL's default port
      databaseName: "mydatabase",
      sslMode: "none",
    });

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
        // Rule to select the table
        {
          "rule-type": "selection",
          "rule-id": "1",
          "rule-name": "SelectTable",
          "object-locator": {
            "schema-name": "mydatabase", // Use the database name here
            "table-name": "User",
          },
          "rule-action": "include",
        },
        // Rule to include the 'id' column
        {
          "rule-type": "transformation",
          "rule-id": "2",
          "rule-name": "IncludeIdColumn",
          "rule-action": "include-column",
          "rule-target": "column",
          "object-locator": {
            "schema-name": "mydatabase", // Use the database name here
            "table-name": "User",
            "column-name": "id",
          },
        },
        // Rule to include the 'username' column
        {
          "rule-type": "transformation",
          "rule-id": "3",
          "rule-name": "IncludeUsernameColumn",
          "rule-action": "include-column",
          "rule-target": "column",
          "object-locator": {
            "schema-name": "mydatabase", // Use the database name here
            "table-name": "User",
            "column-name": "username",
          },
        },
      ],
    });

    // ... (rest of the code remains the same)

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

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

    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      "BastionSecurityGroup",
      {
        vpc,
        description: "Allow SSH access to Bastion Host",
        allowAllOutbound: true,
      },
    );

    // Allow inbound SSH connections on the default port (22)
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH access",
    );

    const bastionHostLinux = new ec2.BastionHostLinux(this, "BastionHost", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      securityGroup: bastionSecurityGroup,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Display commands for connect bastion host using ec2 instance connect
    const createSshKeyCommand = "ssh-keygen -t rsa -f my_rsa_key";
    const pushSshKeyCommand = `aws ec2-instance-connect send-ssh-public-key --region ${cdk.Aws.REGION} --instance-id ${bastionHostLinux.instanceId} --availability-zone ${bastionHostLinux.instanceAvailabilityZone} --instance-os-user ec2-user --ssh-public-key file://my_rsa_key.pub --profile default`;
    const sshCommand = `ssh -o "IdentitiesOnly=yes" -i my_rsa_key ec2-user@${bastionHostLinux.instancePublicDnsName}`;

    new cdk.CfnOutput(this, "CreateSshKeyCommand", {
      value: createSshKeyCommand,
    });
    new cdk.CfnOutput(this, "PushSshKeyCommand", { value: pushSshKeyCommand });
    new cdk.CfnOutput(this, "SshCommand", { value: sshCommand });

    // Define a security group for the RDS instance within the VPC
    const openSearchSecurityGroup = new ec2.SecurityGroup(
      this,
      "MyOpenSearchSecurityGroup",
      {
        vpc,
        description: "Security group for Open Search Service",
      },
    );

    openSearchSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(bastionSecurityGroup.securityGroupId),
      ec2.Port.tcp(443),
      "Allow access from Bastion Host",
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
        // todo: unsafeUnwrap() needs to be replaced with something safe
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

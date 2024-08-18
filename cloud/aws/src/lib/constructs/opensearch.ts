import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import { Construct } from "constructs";

export class OpenSearch extends Construct {
  public readonly domain: opensearch.Domain;

  constructor(scope: Construct, id: string, vpc: ec2.Vpc) {
    super(scope, id);

    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Security group for Open Search Service",
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS access from any IPv4 address",
    );

    this.domain = new opensearch.Domain(this, "Domain", {
      domainName: "oppfy",
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
      securityGroups: [securityGroup],
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}

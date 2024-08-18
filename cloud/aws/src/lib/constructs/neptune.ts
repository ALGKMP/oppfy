import * as neptune from "@aws-cdk/aws-neptune-alpha";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class Neptune extends Construct {
  public readonly cluster: neptune.DatabaseCluster;

  constructor(scope: Construct, id: string, vpc: ec2.Vpc) {
    super(scope, id);

    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Security group for Neptune Service",
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8182),
      "Allow Gremlin access from any IPv4 address",
    );

    this.cluster = new neptune.DatabaseCluster(this, "Cluster", {
      vpc,
      iamAuthentication: false,
      instanceType: neptune.InstanceType.SERVERLESS,
      serverlessScalingConfiguration: {
        minCapacity: 1,
        maxCapacity: 5,
      },
      engineVersion: neptune.EngineVersion.V1_3_0_0,
      securityGroups: [securityGroup],
    });
  }
}

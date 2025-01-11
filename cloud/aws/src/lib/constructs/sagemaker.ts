import * as neptune from "@aws-cdk/aws-neptune-alpha";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sagemaker from "aws-cdk-lib/aws-sagemaker";
import { Construct } from "constructs";

export class NeptuneNotebook extends Construct {
  public readonly notebookInstance: sagemaker.CfnNotebookInstance;

  constructor(
    scope: Construct,
    id: string,
    props: {
      vpc: ec2.Vpc;
      neptuneCluster: neptune.DatabaseCluster;
      neptuneSecurityGroup: ec2.SecurityGroup;
    },
  ) {
    super(scope, id);

    // Create IAM role for the notebook
    const neptuneNotebookRole = new iam.Role(this, "NeptuneNotebookRole", {
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
      description: "Role for neptune notebook",
    });

    neptuneNotebookRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject", "s3:ListBucket"],
        resources: ["*"],
      }),
    );

    // Create lifecycle configuration
    const lifeCycleScript = `#!/bin/bash
sudo -u ec2-user -i <<'EOF'
echo "export GRAPH_NOTEBOOK_AUTH_MODE=DEFAULT" >> ~/.bashrc
echo "export GRAPH_NOTEBOOK_HOST=${props.neptuneCluster.clusterEndpoint.hostname}" >> ~/.bashrc
echo "export GRAPH_NOTEBOOK_PORT=8182" >> ~/.bashrc
echo "export NEPTUNE_LOAD_FROM_S3_ROLE_ARN=" >> ~/.bashrc
echo "export AWS_REGION=${cdk.Stack.of(this).region}" >> ~/.bashrc
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

    // Create notebook instance
    this.notebookInstance = new sagemaker.CfnNotebookInstance(
      this,
      "NeptuneNotebookInstance",
      {
        notebookInstanceName: "neptune-notebook-test",
        subnetId: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnetIds[0],
        securityGroupIds: [props.neptuneSecurityGroup.securityGroupId],
        instanceType: "ml.t3.medium",
        roleArn: neptuneNotebookRole.roleArn,
        lifecycleConfigName:
          notebookLifecycleConfig.notebookInstanceLifecycleConfigName,
      },
    );
  }
}

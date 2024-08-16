import * as cdk from "aws-cdk-lib";
import type * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface LambdaFunctionProps {
  entry: string;
  vpc?: ec2.Vpc;
  securityGroups?: ec2.SecurityGroup[];
  environment?: Record<string, string>;
}

export class LambdaFunction extends Construct {
  public readonly function: lambdaNodeJs.NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    this.function = new lambdaNodeJs.NodejsFunction(this, "Function", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: props.entry,
      handler: "handler",
      timeout: cdk.Duration.minutes(3),
      bundling: {
        format: lambdaNodeJs.OutputFormat.ESM,
        mainFields: ["module", "main"],
        esbuildArgs: {
          "--platform": "node",
          "--target": "esnext",
          "--format": "esm",
          "--banner:js":
            "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
        },
      },
      environment: props.environment,
      vpc: props.vpc,
      securityGroups: props.securityGroups,
    });
  }
}

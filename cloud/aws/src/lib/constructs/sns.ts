import type * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

export class SNSTopic extends Construct {
  public readonly topic: sns.Topic;

  constructor(scope: Construct, id: string, lambdaFunction: lambda.Function) {
    super(scope, id);

    this.topic = new sns.Topic(this, "Topic", {
      displayName: `${id} Topic`,
    });

    this.topic.addSubscription(
      new subscriptions.LambdaSubscription(lambdaFunction),
    );
  }
}

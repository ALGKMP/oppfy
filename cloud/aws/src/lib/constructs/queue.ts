import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export class Queue extends Construct {
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.deadLetterQueue = new sqs.Queue(this, "DeadLetterQueue", {
      retentionPeriod: cdk.Duration.days(1),
    });

    this.queue = new sqs.Queue(this, "Queue", {
      queueName: `${id}Queue`,
      retentionPeriod: cdk.Duration.hours(5),
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: this.deadLetterQueue,
      },
    });
  }
}

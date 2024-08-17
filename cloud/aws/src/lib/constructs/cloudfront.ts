import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import type * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

import { env } from "@oppfy/env";

export interface CloudFrontProps {
  bucket: s3.Bucket;
  accessControlLambda?: lambda.Version;
  isPrivate: boolean;
}

export class CloudFrontDistribution extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontProps) {
    super(scope, id);

    const publicKey = new cloudfront.PublicKey(this, "PublicKey", {
      encodedKey: env.CLOUDFRONT_PUBLIC_KEY,
      comment: "Key for signing CloudFront URLs",
    });

    const keyGroup = new cloudfront.KeyGroup(this, "KeyGroup", {
      items: [publicKey],
    });

    const defaultBehavior: cloudfront.BehaviorOptions = {
      origin: new origins.S3Origin(props.bucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      trustedKeyGroups: props.isPrivate ? [keyGroup] : [],
      edgeLambdas:
        props.accessControlLambda && !props.isPrivate
          ? [
              {
                functionVersion: props.accessControlLambda,
                eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
              },
            ]
          : [],
    };

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: defaultBehavior,
    });
  }
}

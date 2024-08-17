import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import type * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface BaseCloudFrontProps {
  bucket: s3.Bucket;
  oai: cloudfront.IOriginAccessIdentity;
}

interface PrivateCloudFrontProps extends BaseCloudFrontProps {
  isPrivate: true;
  keyGroup: cloudfront.IKeyGroup;
}

interface PublicCloudFrontProps extends BaseCloudFrontProps {
  isPrivate: false;
  accessControlLambda?: lambda.Version;
}

export type CloudFrontProps = PrivateCloudFrontProps | PublicCloudFrontProps;

export class CloudFrontDistribution extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontProps) {
    super(scope, id);

    const defaultBehavior: cloudfront.BehaviorOptions = {
      origin: new origins.S3Origin(props.bucket, {
        originAccessIdentity: props.oai,
      }),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      trustedKeyGroups: props.isPrivate ? [props.keyGroup] : undefined,
      edgeLambdas:
        !props.isPrivate && props.accessControlLambda
          ? [
              {
                functionVersion: props.accessControlLambda,
                eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
              },
            ]
          : undefined,
    };

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: defaultBehavior,
    });
  }
}

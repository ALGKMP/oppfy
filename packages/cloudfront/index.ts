import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import type { InferSelectModel, schema } from "@oppfy/db";
import { env } from "@oppfy/env";

type Profile = InferSelectModel<typeof schema.profile>;
type HydratedProfile = Profile & {
  profilePictureUrl: string | null;
};
type Post = InferSelectModel<typeof schema.post>;
type HydratedPost = Post & {
  postUrl: string;
};

const ONE_HOUR = 60 * 60 * 1000;

export class CloudFront {
  private client: CloudFrontClient;

  constructor() {
    this.client = new CloudFrontClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  hydrateProfile(profile: Profile): HydratedProfile {
    const profilePictureUrl = profile.profilePictureKey
      ? this.getProfilePictureUrl(profile.profilePictureKey)
      : null;

    return {
      ...profile,
      profilePictureUrl,
    };
  }

  hydratePost(post: Post): HydratedPost {
    const postUrl = this.getPublicPostUrl(post.postKey);

    return { ...post, postUrl };
  }

  getProfilePictureUrl(objectKey: string): string {
    return this.getProfilePictureDistributionDomainUrl(objectKey);
  }

  getPublicPostUrl(objectKey: string): string {
    return this.getPublicPostDistributionDomainUrl(objectKey);
  }

  async getSignedPrivatePostUrl(objectKey: string): Promise<string> {
    return await this.getSignedUrl({
      url: this.getPrivatePostDistributionDomainUrl(objectKey),
    });
  }

  async invalidateUserPosts(userId: string): Promise<void> {
    const distributionId = env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_ID;
    const objectPattern = `/posts/*-${userId}-*.jpg`;
    await this.createInvalidation(distributionId, objectPattern);
  }

  async invalidateProfilePicture(userId: string): Promise<void> {
    const distributionId = env.CLOUDFRONT_PROFILE_PICTURE_DISTRIBUTION_ID;
    const objectPattern = `/profile-pictures/${userId}.jpg`;
    await this.createInvalidation(distributionId, objectPattern);
  }

  async createInvalidation(
    distributionId: string,
    objectPattern: string,
  ): Promise<void> {
    const command = new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: 1,
          Items: [objectPattern],
        },
      },
    });

    await this.client.send(command);
  }

  private async getSignedUrl({ url }: { url: string }): Promise<string> {
    return getSignedUrl({
      url,
      keyPairId: env.CLOUDFRONT_PUBLIC_KEY_ID,
      privateKey: env.CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: new Date(Date.now() + ONE_HOUR).toISOString(),
    }) as unknown as Promise<string>;
  }

  private getPublicPostDistributionDomainUrl(objectKey: string): string {
    return `https://${env.CLOUDFRONT_PUBLIC_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  private getPrivatePostDistributionDomainUrl(objectKey: string): string {
    return `https://${env.CLOUDFRONT_PRIVATE_POSTS_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }

  private getProfilePictureDistributionDomainUrl(objectKey: string): string {
    return `https://${env.CLOUDFRONT_PROFILE_PICTURE_DISTRIBUTION_DOMAIN}/${objectKey}`;
  }
}

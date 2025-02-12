import {
  and,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
} from "drizzle-orm";

import { cloudfront } from "@oppfy/cloudfront";
import { db, schema } from "@oppfy/db";
import { env } from "@oppfy/env";
import { s3 } from "@oppfy/s3";

import { handleAwsErrors, handleDatabaseErrors } from "../../errors";

export class ProfileRepository {
  private db = db;

  @handleDatabaseErrors
  async getProfile(profileId: string) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.id, profileId),
    });
  }

  @handleDatabaseErrors
  async getUserProfile(userId: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: { profile: true },
    });
  }

  @handleDatabaseErrors
  async getUserFullProfile(userId: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: {
        profile: {
          with: {
            user: true,
            profileStats: true,
          },
        },
      },
    });
  }

  @handleDatabaseErrors
  async getProfileByUsername(username: string) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.username, username),
    });
  }

  @handleDatabaseErrors
  async updateProfile(
    profileId: string,
    update: Partial<typeof schema.profile.$inferInsert>,
  ) {
    return await this.db
      .update(schema.profile)
      .set(update)
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async updateProfilePicture(profileId: string, newKey: string) {
    await this.db
      .update(schema.profile)
      .set({ profilePictureKey: newKey })
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async usernameExists(username: string) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.username, username),
    });
  }

  @handleDatabaseErrors
  async getBatchProfiles(userIds: string[]) {
    const user = schema.user;
    const profile = schema.profile;
    const fullProfiles = await db
      .select({
        userId: user.id,
        profileId: profile.id,
        privacy: user.privacySetting,
        username: profile.username,
        name: profile.name,
        profilePictureKey: profile.profilePictureKey,
      })
      .from(schema.user)
      .innerJoin(profile, eq(user.profileId, profile.id))
      .where(inArray(user.id, userIds));

    return fullProfiles;
  }

  @handleDatabaseErrors
  async deleteProfile(profileId: string) {
    await this.db
      .delete(schema.profile)
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async profilesByUsername(
    username: string,
    currentUserId: string,
    limit = 15,
  ) {
    const results = await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.name,
        bio: schema.profile.bio,
        profilePictureKey: schema.profile.profilePictureKey,
      })
      .from(schema.user)
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .leftJoin(
        schema.block,
        or(
          and(
            eq(schema.block.userId, currentUserId),
            eq(schema.block.blockedUserId, schema.user.id),
          ),
          and(
            eq(schema.block.userId, schema.user.id),
            eq(schema.block.blockedUserId, currentUserId),
          ),
        ),
      )
      .where(
        and(
          ilike(schema.profile.username, `%${username}%`),
          ne(schema.user.id, currentUserId),
          isNotNull(schema.user.profileId),
          isNull(schema.block.id),
        ),
      )
      .limit(limit);

    return results;
  }

  @handleAwsErrors
  async getSignedProfilePictureUrl(objectKey: string) {
    const url = cloudfront.getProfilePictureUrl(objectKey);
    return await cloudfront.getSignedUrl({ url });
  }

  @handleAwsErrors
  async invalidateProfilePicture(userId: string) {
    const distributionId = env.CLOUDFRONT_PROFILE_DISTRIBUTION_ID;
    const objectPattern = `/profile-pictures/${userId}.jpg`;
    await cloudfront.createInvalidation(distributionId, objectPattern);
  }

  @handleAwsErrors
  async uploadProfilePictureUrl({
    userId,
    contentLength,
  }: {
    userId: string;
    contentLength: number;
  }) {
    const key = `profile-pictures/${userId}.jpg`;

    const metadata = {
      user: userId,
    };

    const presignedUrl = await s3.putObjectPresignedUrl({
      Key: key,
      Bucket: env.S3_PROFILE_BUCKET,
      ContentLength: contentLength,
      ContentType: "image/jpeg",
      Metadata: metadata,
    });

    await this.invalidateProfilePicture(userId);

    return presignedUrl;
  }
}

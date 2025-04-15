import { and, eq, ilike, inArray, isNotNull, ne, or } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";
import {
  withOnboardingCompleted,
  withoutBlocked,
} from "@oppfy/db/utils/query-helpers";

import type { Profile, ProfileInsert, UserStats } from "../../models";
import { TYPES } from "../../symbols";
import type { UserIdParam, UsernameParam } from "../../types";

export interface ProfilesByIdsParams {
  userIds: string[];
}

export interface UpdateProfileParams {
  userId: string;
  update: Partial<ProfileInsert>;
}

export interface ProfilesByUsernameParams {
  userId: string;
  username: string;
  limit?: number;
}

@injectable()
export class ProfileRepository {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.Schema)
    private readonly schema: Schema,
  ) {}

  async getProfile(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<(Profile<"notOnApp"> & Profile<"onboarded">) | undefined> {
    const profile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, userId),
    });

    return profile as Profile<"notOnApp"> & Profile<"onboarded">;
  }

  async getProfileByUsername(
    { username }: UsernameParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile | undefined> {
    const profile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.username, username),
    });

    return profile;
  }

  async getProfilesByIds(
    { userIds }: ProfilesByIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile<"onboarded">[]> {
    let query = db
      .select({
        profile: this.schema.profile,
      })
      .from(this.schema.profile)
      .$dynamic();

    // Use the withOnboardingCompleted helper function
    query = withOnboardingCompleted(query, this.schema.profile);

    // Apply the userIds filter
    query = query.where(inArray(this.schema.profile.userId, userIds));

    const profiles = await query;

    return profiles.map(({ profile }) => profile as Profile<"onboarded">);
  }

  async getProfilesByUsername(
    { userId, username, limit = 10 }: ProfilesByUsernameParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile<"notOnApp">[] & Profile<"onboarded">[]> {
    let query = db
      .select({
        profile: this.schema.profile,
      })
      .from(this.schema.profile)
      .innerJoin(
        this.schema.userStatus,
        eq(this.schema.userStatus.userId, this.schema.profile.userId),
      )
      // Only return either (A) fully onboarded or (B) isOnApp=false
      .where(
        and(
          ilike(this.schema.profile.username, `%${username}%`),
          or(
            eq(this.schema.userStatus.hasCompletedOnboarding, true),
            eq(this.schema.userStatus.isOnApp, false),
          ),
          isNotNull(this.schema.profile.name),
          isNotNull(this.schema.profile.username),
        ),
      )
      .$dynamic();

    query = withoutBlocked(query, userId);

    const results = await query
      .where(ne(this.schema.profile.userId, userId))
      .limit(limit);

    return results.map(
      (result) => result.profile as Profile<"notOnApp"> & Profile<"onboarded">,
    );
  }

  async getStats(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<UserStats | undefined> {
    const stats = await db.query.userStats.findFirst({
      where: eq(this.schema.userStats.userId, userId),
    });

    return stats;
  }

  async getPrivacy(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile["privacy"] | undefined> {
    const profile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, userId),
      columns: {
        privacy: true,
      },
    });

    return profile?.privacy;
  }

  async usernameTaken(
    { username }: UsernameParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<boolean> {
    const profile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.username, username),
    });

    return !!profile;
  }

  async updateProfile(
    params: UpdateProfileParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, update } = params;

    await db
      .update(this.schema.profile)
      .set(update)
      .where(eq(this.schema.profile.userId, userId));
  }
}

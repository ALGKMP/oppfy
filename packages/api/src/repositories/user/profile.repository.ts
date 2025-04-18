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
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";
import {
  onboardingCompletedCondition,
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
    const profileTable = this.schema.profile;

    const query = db
      .select({ profile: profileTable })
      .from(profileTable)
      .innerJoin(
        this.schema.userStatus,
        eq(this.schema.userStatus.userId, profileTable.userId),
      )
      .where(
        and(
          inArray(profileTable.userId, userIds),
          onboardingCompletedCondition(profileTable),
        ),
      );

    const profiles = await query;

    return profiles.map(({ profile }) => profile as Profile<"onboarded">);
  }

  async getProfilesByUsername(
    { userId, username, limit = 10 }: ProfilesByUsernameParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile<"notOnApp">[] & Profile<"onboarded">[]> {
    const rows = await db
      .select({ profile: this.schema.profile })
      .from(this.schema.profile)
      // join in userStatus so we can test onboarding / isOnApp
      .innerJoin(
        this.schema.userStatus,
        eq(this.schema.userStatus.userId, this.schema.profile.userId),
      )
      // left‐join block to weed out any mutual blocks
      .leftJoin(
        this.schema.block,
        or(
          and(
            eq(this.schema.block.senderUserId, userId),
            eq(this.schema.block.recipientUserId, this.schema.profile.userId),
          ),
          and(
            eq(this.schema.block.recipientUserId, userId),
            eq(this.schema.block.senderUserId, this.schema.profile.userId),
          ),
        ),
      )
      // now apply *all* of your filters in one or more .where() calls
      .where(
        and(
          // username match
          ilike(this.schema.profile.username, `%${username}%`),
          // either fully onboarded or not-on-app
          or(
            eq(this.schema.userStatus.hasCompletedOnboarding, true),
            eq(this.schema.userStatus.isOnApp, false),
          ),
          // must have name & username set
          isNotNull(this.schema.profile.name),
          isNotNull(this.schema.profile.username),
          // no block record means block.id IS NULL
          isNull(this.schema.block.id),
          // don’t return yourself
          ne(this.schema.profile.userId, userId),
        ),
      )
      .limit(limit);

    return rows.map(
      (r) => r.profile as Profile<"notOnApp"> & Profile<"onboarded">,
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

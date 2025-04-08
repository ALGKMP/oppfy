import { eq, ilike, inArray, ne } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";
import {
  withOnboardingCompleted,
  withoutBlocked,
} from "@oppfy/db/utils/query-helpers";

import type {
  IProfileRepository,
  ProfilesByIdsParams,
  ProfilesByUsernameParams,
  UpdateProfileParams,
} from "../../interfaces/repositories/user/profile.repository.interface";
import { UserIdParam, UsernameParam } from "../../interfaces/types";
import type { Profile, UserStats } from "../../models";
import { TYPES } from "../../types";

@injectable()
export class ProfileRepository implements IProfileRepository {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.Schema)
    private readonly schema: Schema,
  ) {}

  async getProfile(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile | undefined> {
    const profile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, userId),
    });

    return profile;
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
  ): Promise<Profile[]> {
    const profiles = await db.query.profile.findMany({
      where: inArray(this.schema.profile.userId, userIds),
    });

    return profiles;
  }

  async getProfilesByUsername(
    { userId, username, limit = 10 }: ProfilesByUsernameParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile[]> {
    let query = db
      .select({
        profile: this.schema.profile,
      })
      .from(this.schema.profile)
      .where(ilike(this.schema.profile.username, `%${username}%`))
      .$dynamic();

    query = withOnboardingCompleted(query, this.schema);
    query = withoutBlocked(query, this.schema, userId);

    // Add final conditions and execute
    const results = await query
      .where(ne(this.schema.profile.userId, userId))
      .limit(limit);

    return results.map((result) => result.profile);
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

import { eq, ilike, ne } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";
import {
  withOnboardingCompleted,
  withoutBlocked,
} from "@oppfy/db/utils/query-helpers";

import { TYPES } from "../../container";
import type {
  IProfileRepository,
  ProfilesByUsernameParams,
  UpdateProfileParams,
  UserIdParams,
  UsernameParams,
} from "../../interfaces/repositories/user/profileRepository.interface";
import type { Profile } from "../../models";

@injectable()
export class ProfileRepository implements IProfileRepository {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.Schema)
    private readonly schema: Schema,
  ) {}

  async getProfile(
    params: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile | undefined> {
    const { userId } = params;

    const profile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, userId),
    });

    return profile;
  }

  async getProfilesByUsername(
    params: ProfilesByUsernameParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile[]> {
    const { username, selfUserId, limit = 15 } = params;

    let query = db
      .select({
        profile: this.schema.profile,
      })
      .from(this.schema.profile)
      .where(ilike(this.schema.profile.username, `%${username}%`))
      .$dynamic();

    query = withOnboardingCompleted(query, this.schema);
    query = withoutBlocked(query, this.schema, selfUserId);

    // Add final conditions and execute
    const results = await query
      .where(ne(this.schema.profile.userId, selfUserId))
      .limit(limit);

    return results.map((result) => result.profile);
  }

  async usernameTaken(
    params: UsernameParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<boolean> {
    const { username } = params;

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

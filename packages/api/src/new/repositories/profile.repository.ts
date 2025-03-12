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

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../container";
import {
  BatchProfileResult,
  DeleteProfileParams,
  GetBatchProfilesParams,
  GetProfileByUsernameParams,
  GetProfileParams,
  GetUserFullProfileParams,
  GetUserProfileParams,
  IProfileRepository,
  ProfileResult,
  ProfilesByUsernameParams,
  UpdateProfileParams,
  UpdateProfilePictureParams,
  UsernameExistsParams,
} from "../interfaces/repositories/profileRepository.interface";

@injectable()
export class ProfileRepository implements IProfileRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async getProfile(
    params: GetProfileParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    const { profileId } = params;

    return await db.query.profile.findFirst({
      where: eq(this.schema.profile.id, profileId),
    });
  }

  async getUserProfile(
    params: GetUserProfileParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    const { userId } = params;

    return await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
      with: { profile: true },
    });
  }

  async getUserFullProfile(
    params: GetUserFullProfileParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    const { userId } = params;

    return await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
      with: { profile: { with: { user: true, profileStats: true } } },
    });
  }

  async getProfileByUsername(
    params: GetProfileByUsernameParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    const { username } = params;

    return await db.query.profile.findFirst({
      where: eq(this.schema.profile.username, username),
    });
  }

  async updateProfile(
    params: UpdateProfileParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, update } = params;

    await db
      .update(this.schema.profile)
      .set(update)
      .where(eq(this.schema.profile.id, profileId));
  }

  async updateProfilePicture(
    params: UpdateProfilePictureParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, newKey } = params;

    await db
      .update(this.schema.profile)
      .set({ profilePictureKey: newKey })
      .where(eq(this.schema.profile.id, profileId));
  }

  async usernameExists(
    params: UsernameExistsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    const { username } = params;

    return await db.query.profile.findFirst({
      where: eq(this.schema.profile.username, username),
    });
  }

  async getBatchProfiles(
    params: GetBatchProfilesParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<BatchProfileResult[]> {
    const { userIds } = params;

    const user = this.schema.user;
    const profile = this.schema.profile;

    const fullProfiles = await db
      .select({
        userId: user.id,
        profileId: profile.id,
        privacy: user.privacySetting,
        username: profile.username,
        name: profile.name,
        profilePictureKey: profile.profilePictureKey,
      })
      .from(this.schema.user)
      .innerJoin(profile, eq(profile.userId, user.id))
      .where(inArray(user.id, userIds));

    return fullProfiles;
  }

  async deleteProfile(
    params: DeleteProfileParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId } = params;

    await db
      .delete(this.schema.profile)
      .where(eq(this.schema.profile.id, profileId));
  }

  async profilesByUsername(
    params: ProfilesByUsernameParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<ProfileResult[]> {
    const { username, currentUserId, limit = 15 } = params;

    const results = await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        bio: this.schema.profile.bio,
        profilePictureKey: this.schema.profile.profilePictureKey,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.profile,
        eq(this.schema.profile.userId, this.schema.user.id),
      )
      .leftJoin(
        this.schema.block,
        or(
          and(
            eq(this.schema.block.userWhoIsBlockingId, currentUserId),
            eq(this.schema.block.userWhoIsBlockedId, this.schema.user.id),
          ),
          and(
            eq(this.schema.block.userWhoIsBlockingId, this.schema.user.id),
            eq(this.schema.block.userWhoIsBlockedId, currentUserId),
          ),
        ),
      )
      .where(
        and(
          ilike(this.schema.profile.username, `%${username}%`),
          ne(this.schema.user.id, currentUserId),
          isNotNull(this.schema.profile.userId),
          isNull(this.schema.block.id),
        ),
      )
      .limit(limit);

    return results;
  }
}

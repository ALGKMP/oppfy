import { and, eq, or } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  IRelationshipRepository,
  Relationship,
  UpdateRelationship,
} from "../../interfaces/repositories/social/relationshipRepository.interface";

@injectable()
export class RelationshipRepository implements IRelationshipRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async getByUserIds(
    userIdA: string,
    userIdB: string,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Relationship | undefined> {
    return await db.query.userRelationship.findFirst({
      where: or(
        and(
          eq(this.schema.userRelationship.userIdA, userIdA),
          eq(this.schema.userRelationship.userIdB, userIdB),
        ),
        and(
          eq(this.schema.userRelationship.userIdA, userIdB),
          eq(this.schema.userRelationship.userIdB, userIdA),
        ),
      ),
    });
  }

  async upsert(
    userIdA: string,
    userIdB: string,
    updates: UpdateRelationship,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const relationship = {
      userIdA,
      userIdB,
      ...updates,
    };

    await db
      .insert(this.schema.userRelationship)
      .values(relationship)
      .onConflictDoUpdate({
        target: [
          this.schema.userRelationship.userIdA,
          this.schema.userRelationship.userIdB,
        ],
        set: relationship,
        where: or(
          and(
            eq(this.schema.userRelationship.userIdA, userIdA),
            eq(this.schema.userRelationship.userIdB, userIdB),
          ),
          and(
            eq(this.schema.userRelationship.userIdA, userIdB),
            eq(this.schema.userRelationship.userIdB, userIdA),
          ),
        ),
      });
  }

  async delete(
    userIdA: string,
    userIdB: string,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .delete(this.schema.userRelationship)
      .where(
        or(
          and(
            eq(this.schema.userRelationship.userIdA, userIdA),
            eq(this.schema.userRelationship.userIdB, userIdB),
          ),
          and(
            eq(this.schema.userRelationship.userIdA, userIdB),
            eq(this.schema.userRelationship.userIdB, userIdA),
          ),
        ),
      );
  }

  async removeAllRelationships(
    userIdA: string,
    userIdB: string,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    // Delete follow relationships
    await db
      .delete(this.schema.follow)
      .where(
        or(
          and(
            eq(this.schema.follow.senderId, userIdA),
            eq(this.schema.follow.recipientId, userIdB),
          ),
          and(
            eq(this.schema.follow.senderId, userIdB),
            eq(this.schema.follow.recipientId, userIdA),
          ),
        ),
      );

    // Delete follow requests
    await db
      .delete(this.schema.followRequest)
      .where(
        or(
          and(
            eq(this.schema.followRequest.senderId, userIdA),
            eq(this.schema.followRequest.recipientId, userIdB),
          ),
          and(
            eq(this.schema.followRequest.senderId, userIdB),
            eq(this.schema.followRequest.recipientId, userIdA),
          ),
        ),
      );

    // Delete friend relationships
    // Note: The schema ensures userIdA < userIdB, so we need to order them correctly
    const [smallerId, largerId] =
      userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
    await db
      .delete(this.schema.friend)
      .where(
        and(
          eq(this.schema.friend.userIdA, smallerId),
          eq(this.schema.friend.userIdB, largerId),
        ),
      );

    // Delete friend requests
    await db
      .delete(this.schema.friendRequest)
      .where(
        or(
          and(
            eq(this.schema.friendRequest.senderId, userIdA),
            eq(this.schema.friendRequest.recipientId, userIdB),
          ),
          and(
            eq(this.schema.friendRequest.senderId, userIdB),
            eq(this.schema.friendRequest.recipientId, userIdA),
          ),
        ),
      );

    // Delete notifications between users
    await db
      .delete(this.schema.notifications)
      .where(
        or(
          and(
            eq(this.schema.notifications.senderId, userIdA),
            eq(this.schema.notifications.recipientId, userIdB),
          ),
          and(
            eq(this.schema.notifications.senderId, userIdB),
            eq(this.schema.notifications.recipientId, userIdA),
          ),
        ),
      );
  }
}

import { and, eq, or } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  DeleteParams,
  GetByUserIdsParams,
  IRelationshipRepository,
  Relationship,
  UpdateRelationship,
  UpsertParams,
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
    params: GetByUserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Relationship> {
    const { userIdA, userIdB } = params;

    const relationship = await db.query.userRelationship.findFirst({
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

    if (relationship === undefined) {
      return {
        userIdA,
        userIdB,
        friendshipStatus: "notFriends",
        followStatus: "notFollowing",
        blocked: false,
      };
    }

    return relationship;
  }

  async upsert(
    params: UpsertParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userIdA, userIdB, updates } = params;
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
    params: DeleteParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userIdA, userIdB } = params;
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
}

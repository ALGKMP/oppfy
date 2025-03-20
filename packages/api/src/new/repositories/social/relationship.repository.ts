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
}

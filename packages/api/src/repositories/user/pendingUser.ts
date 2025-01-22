import { and, eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class PendingUserRepository {
  private db = db;

  @handleDatabaseErrors
  async findByPhoneNumber(phoneNumber: string) {
    
  }
}

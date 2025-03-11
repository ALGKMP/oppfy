import "reflect-metadata";

import { Container } from "inversify";

import { db, schema } from "@oppfy/db";

import { IBlockRepository } from "./interfaces/repositories/blockRepository.interface";
import { IFollowRepository } from "./interfaces/repositories/followRepository.interface";
import { IFriendRepository } from "./interfaces/repositories/friendRepository.interface";
import { IReportRepository } from "./interfaces/repositories/reportRepository.interface";
import { IReportService } from "./interfaces/services/reportService.interface";
import { BlockRepository } from "./repositories/block.repository";
import { FollowRepository } from "./repositories/follow.repository";
import { FriendRepository } from "./repositories/friend.repository";
import { ReportRepository } from "./repositories/report.repository";
import { ReportService } from "./services/report.service";

// Define symbol constants for our interfaces
export const TYPES = {
  // DB Dependencies
  Database: Symbol.for("Database"),
  Schema: Symbol.for("Schema"),
  Transaction: Symbol.for("Transaction"),

  // Repositories
  ReportRepository: Symbol.for("ReportRepository"),
  BlockRepository: Symbol.for("BlockRepository"),
  FollowRepository: Symbol.for("FollowRepository"),
  FriendRepository: Symbol.for("FriendRepository"),

  // Services
  ReportService: Symbol.for("ReportService"),
};

// Create and configure the container
const container = new Container();

// Bind DB dependencies
container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Schema).toConstantValue(schema);
container.bind(TYPES.Transaction).toConstantValue(db.transaction);

// Bind repositories
container.bind<IReportRepository>(TYPES.ReportRepository).to(ReportRepository);
container.bind<IBlockRepository>(TYPES.BlockRepository).to(BlockRepository);
container.bind<IFollowRepository>(TYPES.FollowRepository).to(FollowRepository);
container.bind<IFriendRepository>(TYPES.FriendRepository).to(FriendRepository);

// Bind services
container.bind<IReportService>(TYPES.ReportService).to(ReportService);

export { container };

import "reflect-metadata";

import { Container } from "inversify";

import { db, schema } from "@oppfy/db";

import type { IBlockRepository } from "./interfaces/repositories/social/blockRepository.interface";
import type { IFollowRepository } from "./interfaces/repositories/social/followRepository.interface";
import type { IFriendRepository } from "./interfaces/repositories/social/friendRepository.interface";
import type { IContactsRepository } from "./interfaces/repositories/user/contactsRepository.interface";
import type { INotificationsRepository } from "./interfaces/repositories/user/notificationRepository.interface";
import type { IProfileRepository } from "./interfaces/repositories/user/profileRepository.interface";
import type { IProfileStatsRepository } from "./interfaces/repositories/user/profileStatsRepository.interface";
import type { IReportRepository } from "./interfaces/repositories/user/reportRepository.interface";
import type { IUserRepository } from "./interfaces/repositories/user/userRepository.interface";
import type { IReportService } from "./interfaces/services/user/reportService.interface";
import { BlockRepository } from "./repositories/social/block.repository";
import { FollowRepository } from "./repositories/social/follow.repository";
import { FriendRepository } from "./repositories/social/friend.repository";
import { ContactsRepository } from "./repositories/user/contacts.repository";
import { NotificationsRepository } from "./repositories/user/notifications.repository";
import { ProfileRepository } from "./repositories/user/profile.repository";
import { ProfileStatsRepository } from "./repositories/user/profileStats.repository";
import { ReportRepository } from "./repositories/user/report.repository";
import { UserRepository } from "./repositories/user/user.repository";
import { ReportService } from "./services/user/report.service";

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
  ContactsRepository: Symbol.for("ContactsRepository"),
  NotificationsRepository: Symbol.for("NotificationsRepository"),
  ProfileRepository: Symbol.for("ProfileRepository"),
  ProfileStatsRepository: Symbol.for("ProfileStatsRepository"),
  UserRepository: Symbol.for("UserRepository"),
  RelationshipRepository: Symbol.for("RelationshipRepository"),
  PostRepository: Symbol.for("PostRepository"),
  LikeRepository: Symbol.for("LikeRepository"),
  CommentRepository: Symbol.for("CommentRepository"),
  PostStatsRepository: Symbol.for("PostStatsRepository"),


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
container
  .bind<IContactsRepository>(TYPES.ContactsRepository)
  .to(ContactsRepository);
container
  .bind<INotificationsRepository>(TYPES.NotificationsRepository)
  .to(NotificationsRepository);
container
  .bind<IProfileRepository>(TYPES.ProfileRepository)
  .to(ProfileRepository);
container
  .bind<IProfileStatsRepository>(TYPES.ProfileStatsRepository)
  .to(ProfileStatsRepository);
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);

// Bind services
container.bind<IReportService>(TYPES.ReportService).to(ReportService);

export { container };

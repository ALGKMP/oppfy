import "reflect-metadata";

import { Container } from "inversify";

import { CloudFront } from "@oppfy/cloudfront";
import { db, schema } from "@oppfy/db";
import { S3 } from "@oppfy/s3";

import type { IBlockRepository } from "./interfaces/repositories/social/block.repository.interface";
import type { IFollowRepository } from "./interfaces/repositories/social/follow.repository.interface";
import type { IFriendRepository } from "./interfaces/repositories/social/friend.repository.interface";
import type { IReportRepository } from "./interfaces/repositories/social/report.repository.interface";
import type { IContactsRepository } from "./interfaces/repositories/user/contacts.repository.interface";
import type { INotificationsRepository } from "./interfaces/repositories/user/notification.repository.interface";
import type { IProfileRepository } from "./interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "./interfaces/repositories/user/user.repository.interface";
import type { IPostService } from "./interfaces/services/content/post.service.interface";
import type { IPostInteractionService } from "./interfaces/services/content/postInteraction.service.interface";
import type { IBlockService } from "./interfaces/services/social/block.service.interface";
import type { IFollowService } from "./interfaces/services/social/follow.service.interface";
import type { IFriendService } from "./interfaces/services/social/friend.service.interface";
import type { IReportService } from "./interfaces/services/social/report.service.interface";
import type { IProfileService } from "./interfaces/services/user/profile.service.interface";
import type { IUserService } from "./interfaces/services/user/user.service.interface";
import { BlockRepository } from "./repositories/social/block.repository";
import { FollowRepository } from "./repositories/social/follow.repository";
import { FriendRepository } from "./repositories/social/friend.repository";
import { ReportRepository } from "./repositories/social/report.repository";
import { ContactsRepository } from "./repositories/user/contacts.repository";
import { NotificationsRepository } from "./repositories/user/notifications.repository";
import { ProfileRepository } from "./repositories/user/profile.repository";
import { UserRepository } from "./repositories/user/user.repository";
import { PostService } from "./services/content/post.service";
import { PostInteractionService } from "./services/content/postInteraction.service";
import { Services } from "./services/index";
import { BlockService } from "./services/social/block.service";
import { FollowService } from "./services/social/follow.service";
import { FriendService } from "./services/social/friend.service";
import { ReportService } from "./services/social/report.service";
import { ProfileService } from "./services/user/profile.service";
import { UserService } from "./services/user/user.service";

// Define symbol constants for our interfaces
export const TYPES = {
  // DB Dependencies
  Database: Symbol.for("Database"),
  Schema: Symbol.for("Schema"),

  // SDKs
  S3: Symbol.for("S3"),
  CloudFront: Symbol.for("CloudFront"),
  TwilioService: Symbol.for("TwilioService"),


  // Repositories
  ReportRepository: Symbol.for("ReportRepository"),
  BlockRepository: Symbol.for("BlockRepository"),
  FollowRepository: Symbol.for("FollowRepository"),
  FriendRepository: Symbol.for("FriendRepository"),
  ContactsRepository: Symbol.for("ContactsRepository"),
  NotificationsRepository: Symbol.for("NotificationsRepository"),
  ProfileRepository: Symbol.for("ProfileRepository"),
  UserStatsRepository: Symbol.for("UserStatsRepository"),
  UserRepository: Symbol.for("UserRepository"),
  RelationshipRepository: Symbol.for("RelationshipRepository"),
  PostRepository: Symbol.for("PostRepository"),
  LikeRepository: Symbol.for("LikeRepository"),
  CommentRepository: Symbol.for("CommentRepository"),
  PostStatsRepository: Symbol.for("PostStatsRepository"),
  PostInteractionRepository: Symbol.for("PostInteractionRepository"),

  // Services
  Services: Symbol.for("Services"),

  UserService: Symbol.for("UserService"),
  AuthService: Symbol.for("AuthService"),
  ProfileService: Symbol.for("ProfileService"),
  ReportService: Symbol.for("ReportService"),
  FriendService: Symbol.for("FriendService"),
  FollowService: Symbol.for("FollowService"),
  BlockService: Symbol.for("BlockService"),
  PostService: Symbol.for("PostService"),
  PostInteractionService: Symbol.for("PostInteractionService"),
  NotificationService: Symbol.for("NotificationService"),
};

// Create and configure the container
const container = new Container();

// Bind DB dependencies
container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Schema).toConstantValue(schema);

// Bind sdk's
container.bind<S3>(TYPES.S3).to(S3);
container.bind<CloudFront>(TYPES.CloudFront).to(CloudFront);

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
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);

// Bind services
container.bind<IReportService>(TYPES.ReportService).to(ReportService);
container.bind<IUserService>(TYPES.UserService).to(UserService);
container.bind<IProfileService>(TYPES.ProfileService).to(ProfileService);
container.bind<IFriendService>(TYPES.FriendService).to(FriendService);
container.bind<IFollowService>(TYPES.FollowService).to(FollowService);
container.bind<IBlockService>(TYPES.BlockService).to(BlockService);
container.bind<IPostService>(TYPES.PostService).to(PostService);
container
  .bind<IPostInteractionService>(TYPES.PostInteractionService)
  .to(PostInteractionService);

container.bind<Services>(TYPES.Services).to(Services);

export { container };

// file: inversify.config.ts

import "reflect-metadata";

import { Container } from "inversify";

import { CloudFront } from "@oppfy/cloudfront";
import { db, schema } from "@oppfy/db";
import { Mux } from "@oppfy/mux";
import { S3 } from "@oppfy/s3";
import { Twilio } from "@oppfy/twilio";

// Repositories
import { CommentRepository } from "./repositories/content/comment.repository";
import { LikeRepository } from "./repositories/content/like.repository";
import { PostRepository } from "./repositories/content/post.repository";
import { BlockRepository } from "./repositories/social/block.repository";
import { FollowRepository } from "./repositories/social/follow.repository";
import { FriendRepository } from "./repositories/social/friend.repository";
import { ReportRepository } from "./repositories/social/report.repository";
import { ContactsRepository } from "./repositories/user/contacts.repository";
import { NotificationsRepository } from "./repositories/user/notifications.repository";
import { ProfileRepository } from "./repositories/user/profile.repository";
import { UserRepository } from "./repositories/user/user.repository";
// Services
import { PostService } from "./services/content/post.service";
import { PostInteractionService } from "./services/content/postInteraction.service";
import { Services } from "./services/index";
import { BlockService } from "./services/social/block.service";
import { FollowService } from "./services/social/follow.service";
import { FriendService } from "./services/social/friend.service";
import { ReportService } from "./services/social/report.service";
import { AuthService } from "./services/user/auth.service";
import { ContactsService } from "./services/user/contacts.service";
import { ProfileService } from "./services/user/profile.service";
import { UserService } from "./services/user/user.service";

export const TYPES = {
  // DB and schema
  Database: Symbol.for("Database"),
  Schema: Symbol.for("Schema"),

  // SDKs
  S3: Symbol.for("S3"),
  CloudFront: Symbol.for("CloudFront"),
  Twilio: Symbol.for("Twilio"),
  Mux: Symbol.for("Mux"),

  // Repositories
  ReportRepository: Symbol.for("ReportRepository"),
  BlockRepository: Symbol.for("BlockRepository"),
  FollowRepository: Symbol.for("FollowRepository"),
  FriendRepository: Symbol.for("FriendRepository"),
  ContactsRepository: Symbol.for("ContactsRepository"),
  NotificationsRepository: Symbol.for("NotificationsRepository"),
  ProfileRepository: Symbol.for("ProfileRepository"),
  UserRepository: Symbol.for("UserRepository"),
  PostRepository: Symbol.for("PostRepository"),
  CommentRepository: Symbol.for("CommentRepository"),
  LikeRepository: Symbol.for("LikeRepository"),

  // Services
  ReportService: Symbol.for("ReportService"),
  UserService: Symbol.for("UserService"),
  ProfileService: Symbol.for("ProfileService"),
  FriendService: Symbol.for("FriendService"),
  FollowService: Symbol.for("FollowService"),
  ContactsService: Symbol.for("ContactsService"),
  BlockService: Symbol.for("BlockService"),
  PostService: Symbol.for("PostService"),
  PostInteractionService: Symbol.for("PostInteractionService"),
  AuthService: Symbol.for("AuthService"),

  // "Services" aggregator
  Services: Symbol.for("Services"),
} as const;

const container = new Container();

container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Schema).toConstantValue(schema);

container.bind<CloudFront>(TYPES.CloudFront).to(CloudFront);
container.bind<S3>(TYPES.S3).to(S3);
container.bind<Twilio>(TYPES.Twilio).to(Twilio);
container.bind<Mux>(TYPES.Mux).to(Mux);

container.bind<ReportRepository>(TYPES.ReportRepository).to(ReportRepository);
container.bind<BlockRepository>(TYPES.BlockRepository).to(BlockRepository);
container.bind<FollowRepository>(TYPES.FollowRepository).to(FollowRepository);
container.bind<FriendRepository>(TYPES.FriendRepository).to(FriendRepository);
container
  .bind<ContactsRepository>(TYPES.ContactsRepository)
  .to(ContactsRepository);
container
  .bind<NotificationsRepository>(TYPES.NotificationsRepository)
  .to(NotificationsRepository);
container
  .bind<ProfileRepository>(TYPES.ProfileRepository)
  .to(ProfileRepository);
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<PostRepository>(TYPES.PostRepository).to(PostRepository);
container
  .bind<CommentRepository>(TYPES.CommentRepository)
  .to(CommentRepository);
container.bind<LikeRepository>(TYPES.LikeRepository).to(LikeRepository);

container.bind<ReportService>(TYPES.ReportService).to(ReportService);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<ProfileService>(TYPES.ProfileService).to(ProfileService);
container.bind<FriendService>(TYPES.FriendService).to(FriendService);
container.bind<FollowService>(TYPES.FollowService).to(FollowService);
container.bind<ContactsService>(TYPES.ContactsService).to(ContactsService);
container.bind<BlockService>(TYPES.BlockService).to(BlockService);
container.bind<PostService>(TYPES.PostService).to(PostService);
container
  .bind<PostInteractionService>(TYPES.PostInteractionService)
  .to(PostInteractionService);
container.bind<AuthService>(TYPES.AuthService).to(AuthService);

container.bind<Services>(TYPES.Services).to(Services);

export { container };

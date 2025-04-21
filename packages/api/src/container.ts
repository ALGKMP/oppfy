import "reflect-metadata";

import { Container } from "inversify";

import { CloudFront } from "@oppfy/cloudfront";
import { db, schema } from "@oppfy/db";
import { Mux } from "@oppfy/mux";
import { SQS } from "@oppfy/sqs";
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
import { NotificationRepository } from "./repositories/user/notifications.repository";
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
import { NotificationService } from "./services/user/notification.service";
import { ProfileService } from "./services/user/profile.service";
import { UserService } from "./services/user/user.service";
import { TYPES } from "./symbols";

const container = new Container();

container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Schema).toConstantValue(schema);

container.bind<CloudFront>(TYPES.CloudFront).to(CloudFront);
container.bind<S3>(TYPES.S3).to(S3);
container.bind<Twilio>(TYPES.Twilio).to(Twilio);
container.bind<Mux>(TYPES.Mux).to(Mux);
container.bind<SQS>(TYPES.SQS).to(SQS);

container.bind<ReportRepository>(TYPES.ReportRepository).to(ReportRepository);
container.bind<BlockRepository>(TYPES.BlockRepository).to(BlockRepository);
container.bind<FollowRepository>(TYPES.FollowRepository).to(FollowRepository);
container.bind<FriendRepository>(TYPES.FriendRepository).to(FriendRepository);
container
  .bind<ContactsRepository>(TYPES.ContactsRepository)
  .to(ContactsRepository);
container
  .bind<NotificationRepository>(TYPES.NotificationRepository)
  .to(NotificationRepository);
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
container
  .bind<NotificationService>(TYPES.NotificationService)
  .to(NotificationService);

container.bind<Services>(TYPES.Services).to(Services);

export { container };

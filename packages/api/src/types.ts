export const TYPES = {
  // DB Dependencies
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
  ContactsService: Symbol.for("ContactsService"),
  FollowService: Symbol.for("FollowService"),
  BlockService: Symbol.for("BlockService"),
  PostService: Symbol.for("PostService"),
  PostInteractionService: Symbol.for("PostInteractionService"),
  NotificationService: Symbol.for("NotificationService"),
} as const;

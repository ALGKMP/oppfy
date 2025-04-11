const TYPES = {
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
  NotificationService: Symbol.for("NotificationService"),
  BlockService: Symbol.for("BlockService"),
  PostService: Symbol.for("PostService"),
  PostInteractionService: Symbol.for("PostInteractionService"),
  AuthService: Symbol.for("AuthService"),

  // "Services" aggregator
  Services: Symbol.for("Services"),
} as const;

export { TYPES };

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const privacyEnum = pgEnum("privacy", ["public", "private"]);

export const eventTypeEnum = pgEnum("event_type", [
  "like",
  "post",
  "comment",
  "follow",
  "friend",
]);

export const entityTypeEnum = pgEnum("entity_type", [
  "post",
  "profile",
  "comment",
]);

export const postStatusEnum = pgEnum("post_status", ["pending", "processed"]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const reportUserReasonEnum = pgEnum("report_user_reason", [
  "Posting explicit content",
  "Under the age of 13",
  "Catfish account",
  "Scam/spam account",
]);

export const reportPostReasonEnum = pgEnum("report_post_reason", [
  "Violent or abusive",
  "Sexually explicit or predatory",
  "Hate, harassment or bullying",
  "Suicide and self-harm",
  "Spam or scam",
  "Other",
]);

export const reportCommentReasonEnum = pgEnum("report_comment_reason", [
  "Violent or abusive",
  "Sexually explicit or predatory",
  "Hate, harassment or bullying",
  "Suicide and self-harm",
  "Spam or scam",
  "Other",
]);

export const user = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  phoneNumber: text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userStatus = pgTable("user_status", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isOnApp: boolean().default(true).notNull(),
  hasCompletedTutorial: boolean()
    .default(false)
    .notNull(),
  hasCompletedOnboarding: boolean()
    .default(false)
    .notNull(),
  createdAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userStatusRelations = relations(userStatus, ({ one }) => ({
  user: one(user, {
    fields: [userStatus.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(profile, {
    fields: [user.id],
    references: [profile.userId],
  }),
  profileStats: one(userStats, {
    fields: [user.id],
    references: [userStats.userId],
  }),
  notificationSettings: one(notificationSettings, {
    fields: [user.id],
    references: [notificationSettings.userId],
  }),
  userStatus: one(userStatus, {
    fields: [user.id],
    references: [userStatus.userId],
  }),
  receivedNotifications: many(notification, {
    relationName: "notificationRecipient",
  }),
  sentNotifications: many(notification, {
    relationName: "notificationSender",
  }),
  pushTokens: many(pushToken),
}));

export const contact = pgTable("contact", {
  id: varchar("id", { length: 128 }).primaryKey(),
  createdAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userContact = pgTable(
  "user_contact",
  {
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    contactId: varchar({ length: 128 })
      .notNull()
      .references(() => contact.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.contactId] }),
    userIdx: index("user_contact_user_idx").on(table.userId),
    contactIdx: index("user_contact_contact_idx").on(table.contactId),
  }),
);

export const profile = pgTable(
  "profile",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    privacy: privacyEnum().default("public").notNull(),
    username: varchar({ length: 30 }).unique(),
    name: varchar({ length: 30 }),
    dateOfBirth: timestamp(),
    bio: varchar({ length: 100 }),
    profilePictureKey: text(),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameIdx: index("profile_name_idx").on(table.name),
  }),
);

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, {
    fields: [profile.id],
    references: [user.id],
  }),
}));

export const userStats = pgTable("user_stats", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  followers: integer().notNull().default(0),
  following: integer().notNull().default(0),
  friends: integer().notNull().default(0),
  friendRequests: integer().notNull().default(0),
  followRequests: integer().notNull().default(0),
  posts: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profileStatsRelations = relations(userStats, ({ one }) => ({
  user: one(user, {
    fields: [userStats.userId],
    references: [user.id],
  }),
}));

export const pushToken = pgTable("push_token", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  token: text().notNull(),
  createdAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pushTokenRelations = relations(pushToken, ({ one }) => ({
  user: one(user, {
    fields: [pushToken.userId],
    references: [user.id],
  }),
}));

export const notification = pgTable(
  "notification",
  {
    id: uuid().primaryKey().defaultRandom(),
    senderUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    recipientUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    read: boolean().default(false).notNull(),
    active: boolean().default(true).notNull(),
    eventType: eventTypeEnum().notNull(),
    entityId: varchar({ length: 255 }),
    entityType: entityTypeEnum(),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    recipientIdx: index("notification_recipient_idx").on(table.recipientUserId),
    senderIdx: index("notification_sender_idx").on(table.senderUserId),
    readIdx: index("notification_read_idx").on(table.read),
    activeIdx: index("notification_active_idx").on(table.active),
    eventTypeIdx: index("notification_event_type_idx").on(table.eventType),
    createdAtIdx: index("notification_created_at_idx").on(table.createdAt),
  }),
);

export const notificationRelations = relations(notification, ({ one }) => ({
  recipient: one(user, {
    fields: [notification.recipientUserId],
    references: [user.id],
    relationName: "notificationRecipient",
  }),
  sender: one(user, {
    fields: [notification.senderUserId],
    references: [user.id],
    relationName: "notificationSender",
  }),
}));

export const notificationSettings = pgTable("notification_settings", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  posts: boolean().default(true).notNull(),
  likes: boolean().default(true).notNull(),
  mentions: boolean().default(true).notNull(),
  comments: boolean().default(true).notNull(),
  followRequests: boolean().default(true).notNull(),
  friendRequests: boolean().default(true).notNull(),
  createdAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const post = pgTable(
  "post",
  {
    id: uuid().primaryKey().defaultRandom(),
    authorUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    recipientUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    caption: text(),
    postKey: text().unique().notNull(),
    width: integer().notNull().default(500),
    height: integer().notNull().default(500),
    mediaType: mediaTypeEnum().notNull(),
    status: postStatusEnum().default("pending").notNull(),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    authorUserIdx: index("post_author_user_idx").on(table.authorUserId),
    recipientUserIdx: index("post_recipient_user_idx").on(
      table.recipientUserId,
    ),
    createdAtIdx: index("post_created_at_idx").on(table.createdAt),
  }),
);

export const postRelations = relations(post, ({ one, many }) => ({
  author: one(user, {
    relationName: "author",
    fields: [post.authorUserId],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [post.recipientUserId],
    references: [user.id],
  }),
  postStats: one(postStats, {
    fields: [post.id],
    references: [postStats.postId],
  }),
  likes: many(like),
  comments: many(comment),
}));

export const postStats = pgTable("post_stats", {
  id: uuid().primaryKey().defaultRandom(),
  postId: uuid()
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  likes: integer().notNull().default(0),
  comments: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const like = pgTable(
  "like",
  {
    id: uuid().primaryKey().defaultRandom(),
    postId: uuid()
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    postIdx: index("like_post_idx").on(table.postId),
    userIdx: index("like_user_idx").on(table.userId),
    uniquePostUser: uniqueIndex("like_post_user_unique").on(
      table.postId,
      table.userId,
    ),
  }),
);

export const likeRelations = relations(like, ({ one }) => ({
  post: one(post, {
    fields: [like.postId],
    references: [post.id],
  }),
  likedBy: one(user, {
    fields: [like.userId],
    references: [user.id],
  }),
}));

export const comment = pgTable(
  "comment",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postId: uuid()
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    body: text().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    postIdx: index("comment_post_idx").on(table.postId),
    userIdx: index("comment_user_idx").on(table.userId),
  }),
);

export const commentRelations = relations(comment, ({ one }) => ({
  post: one(post, {
    fields: [comment.postId],
    references: [post.id],
  }),
  commentedBy: one(user, {
    fields: [comment.userId],
    references: [user.id],
  }),
}));

export const follow = pgTable(
  "follow",
  {
    id: uuid().primaryKey().defaultRandom(),
    senderUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    senderIdx: index("follow_sender_idx").on(table.senderUserId),
    recipientIdx: index("follow_recipient_idx").on(table.recipientUserId),
  }),
);

export const followRelations = relations(follow, ({ one }) => ({
  sender: one(user, {
    relationName: "sender",
    fields: [follow.senderUserId],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [follow.recipientUserId],
    references: [user.id],
  }),
}));

export const friendRequest = pgTable(
  "friend_request",
  {
    id: uuid().primaryKey().defaultRandom(),
    senderUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    senderIdx: index("friend_request_sender_idx").on(table.senderUserId),
    recipientIdx: index("friend_request_recipient_idx").on(
      table.recipientUserId,
    ),
    uniqueSenderRecipient: uniqueIndex(
      "friend_request_sender_recipient_unique",
    ).on(table.senderUserId, table.recipientUserId),
  }),
);

export const friendRequestRelations = relations(friendRequest, ({ one }) => ({
  sender: one(user, {
    relationName: "sender",
    fields: [friendRequest.senderUserId],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [friendRequest.recipientUserId],
    references: [user.id],
  }),
}));

export const followRequest = pgTable(
  "follow_request",
  {
    id: uuid().primaryKey().defaultRandom(),
    senderUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    senderIdx: index("follow_request_sender_idx").on(table.senderUserId),
    recipientIdx: index("follow_request_recipient_idx").on(
      table.recipientUserId,
    ),
    uniqueSenderRecipient: uniqueIndex(
      "follow_request_sender_recipient_unique",
    ).on(table.senderUserId, table.recipientUserId),
  }),
);

export const followRequestRelations = relations(followRequest, ({ one }) => ({
  sender: one(user, {
    relationName: "sender",
    fields: [followRequest.senderUserId],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [followRequest.recipientUserId],
    references: [user.id],
  }),
}));

export const friend = pgTable(
  "friend",
  {
    id: uuid().primaryKey().defaultRandom(),
    userIdA: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userIdB: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    currentStreak: integer().notNull().default(0),
    longestStreak: integer().notNull().default(0),
    lastPostDate: timestamp({ withTimezone: true }),
    lastPostAuthorId: uuid()
      .references(() => user.id, { onDelete: "set null" }),
    lastPostId: uuid()
      .references(() => post.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    orderCheck: check("friend_order_check", sql`user_id_a < user_id_b`),
    selfCheck: check("friend_self_check", sql`user_id_a != user_id_b`),
    userAIdx: index("friend_user_a_idx").on(table.userIdA),
    userBIdx: index("friend_user_b_idx").on(table.userIdB),
    uniqueUserPair: uniqueIndex("friend_user_pair_unique").on(
      table.userIdA,
      table.userIdB,
    ),
  }),
);

export const friendRelations = relations(friend, ({ one }) => ({
  userA: one(user, {
    relationName: "userA",
    fields: [friend.userIdA],
    references: [user.id],
  }),
  userB: one(user, {
    relationName: "userB",
    fields: [friend.userIdB],
    references: [user.id],
  }),
}));

export const block = pgTable(
  "block",
  {
    id: uuid().primaryKey().defaultRandom(),
    senderUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    recipientUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    senderUserIdx: index("block_sender_user_idx").on(table.senderUserId),
    recipientUserIdx: index("block_recipient_user_idx").on(
      table.recipientUserId,
    ),
    uniqueBlockPair: uniqueIndex("block_unique_pair").on(
      table.senderUserId,
      table.recipientUserId,
    ),
  }),
);

export const blockRelations = relations(block, ({ one }) => ({
  userWhoIsBlocking: one(user, {
    relationName: "userWhoIsBlocking",
    fields: [block.senderUserId],
    references: [user.id],
  }),
  userWhoIsBlocked: one(user, {
    relationName: "userWhoIsBlocked",
    fields: [block.recipientUserId],
    references: [user.id],
  }),
}));

export const reportComment = pgTable(
  "report_comment",
  {
    id: uuid().primaryKey().defaultRandom(),
    commentId: uuid()
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    reporterUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reason: reportCommentReasonEnum().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    commentIdx: index("report_comment_comment_idx").on(table.commentId),
    reporterIdx: index("report_comment_reporter_idx").on(table.reporterUserId),
  }),
);

export const reportPost = pgTable(
  "report_post",
  {
    id: uuid().primaryKey().defaultRandom(),
    postId: uuid()
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    reporterUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reason: reportPostReasonEnum().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    postIdx: index("report_post_post_idx").on(table.postId),
    reporterIdx: index("report_post_reporter_idx").on(table.reporterUserId),
  }),
);

export const reportPostRelations = relations(reportPost, ({ one }) => ({
  reportedPost: one(post, {
    fields: [reportPost.postId],
    references: [post.id],
  }),
  reporter: one(user, {
    fields: [reportPost.reporterUserId],
    references: [user.id],
  }),
}));

export const reportUser = pgTable(
  "report_user",
  {
    id: uuid().primaryKey().defaultRandom(),
    reportedUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reporterUserId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reason: reportUserReasonEnum().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    reportedUserIdx: index("report_user_reported_idx").on(table.reportedUserId),
    reporterIdx: index("report_user_reporter_idx").on(table.reporterUserId),
  }),
);

export const reportCommentRelations = relations(reportComment, ({ one }) => ({
  reportedComment: one(comment, {
    fields: [reportComment.commentId],
    references: [comment.id],
  }),
  reporter: one(user, {
    fields: [reportComment.reporterUserId],
    references: [user.id],
  }),
}));

export const reportUserRelations = relations(reportUser, ({ one }) => ({
  reportedUser: one(user, {
    fields: [reportUser.reportedUserId],
    references: [user.id],
  }),
  reporter: one(user, {
    fields: [reportUser.reporterUserId],
    references: [user.id],
  }),
}));

export const waitlist = pgTable("waitlist", {
  id: uuid().primaryKey().defaultRandom(),
  phoneNumber: text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true })
    .defaultNow()
    .notNull(),
});

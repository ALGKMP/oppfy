import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
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

const dateType = customType<{ data: Date | null; driverData: string | null }>({
  dataType() {
    return "date";
  },
  toDriver(value: Date | null): string | null {
    return value ? (value.toISOString().split("T")[0] ?? null) : null;
  },
  fromDriver(value: string | null): Date | null {
    return value ? new Date(value) : null;
  },
});

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

export const postTypeEnum = pgEnum("post_type", [
  "public",
  "private",
  "direct",
]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const friendStatusEnum = pgEnum("friend_status", [
  "notFriends",
  "friends",
  "outboundRequest",
  "inboundRequest",
]);

export const followStatusEnum = pgEnum("follow_status", [
  "notFollowing",
  "following",
  "outboundRequest",
  "inboundRequest",
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

export const reportUserReasonEnum = pgEnum("report_user_reason", [
  "Posting explicit content",
  "Under the age of 13",
  "Catfish account",
  "Scam/spam account",
]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  notificationSettingsId: uuid("notification_settings_id")
    .notNull()
    .references(() => notificationSettings.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userStatus = pgTable("user_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isOnApp: boolean("is_on_app").default(true).notNull(),
  hasCompletedTutorial: boolean("has_completed_tutorial")
    .default(false)
    .notNull(),
  hasCompletedOnboarding: boolean("has_completed_onboarding")
    .default(false)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
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
    fields: [user.notificationSettingsId],
    references: [notificationSettings.id],
  }),
  userStatus: one(userStatus, {
    fields: [user.id],
    references: [userStatus.userId],
  }),
  receivedNotifications: many(notifications, {
    relationName: "notificationRecipient",
  }),
  sentNotifications: many(notifications, {
    relationName: "notificationSender",
  }),
  pushTokens: many(pushToken),
}));

export const contact = pgTable("contact", {
  id: varchar("id", { length: 128 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userContact = pgTable(
  "user_contact",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    contactId: varchar("contact_id", { length: 128 })
      .notNull()
      .references(() => contact.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
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
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    privacy: privacyEnum("privacy").default("public").notNull(),
    username: varchar("username", { length: 30 }).unique().notNull(),
    name: varchar("name", { length: 30 }),
    dateOfBirth: dateType("date_of_birth"),
    bio: varchar("bio", { length: 100 }),
    profilePictureKey: text("profile_picture_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
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

export const userStats = pgTable("profile_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  followers: integer("followers").notNull().default(0),
  following: integer("following").notNull().default(0),
  friends: integer("friends").notNull().default(0),
  posts: integer("posts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
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
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  token: text("token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pushTokenRelations = relations(pushToken, ({ one }) => ({
  user: one(user, {
    fields: [pushToken.userId],
    references: [user.id],
  }),
}));

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    read: boolean("read").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    eventType: eventTypeEnum("event_type").notNull(),
    entityId: varchar("entity_id", { length: 255 }),
    entityType: entityTypeEnum("entity_type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    recipientIdx: index("notifications_recipient_idx").on(table.recipientId),
    senderIdx: index("notifications_sender_idx").on(table.senderId),
    readIdx: index("notifications_read_idx").on(table.read),
    activeIdx: index("notifications_active_idx").on(table.active),
    eventTypeIdx: index("notifications_event_type_idx").on(table.eventType),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  }),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(user, {
    fields: [notifications.recipientId],
    references: [user.id],
    relationName: "notificationRecipient",
  }),
  sender: one(user, {
    fields: [notifications.senderId],
    references: [user.id],
    relationName: "notificationSender",
  }),
}));

export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  posts: boolean("posts").default(true).notNull(),
  likes: boolean("likes").default(true).notNull(),
  mentions: boolean("mentions").default(true).notNull(),
  comments: boolean("comments").default(true).notNull(),
  followRequests: boolean("follow_requests").default(true).notNull(),
  friendRequests: boolean("friend_requests").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const post = pgTable(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    caption: text("caption").notNull().default(""),
    key: text("key").unique().notNull(),
    width: integer("width").notNull().default(500),
    height: integer("height").notNull().default(500),
    mediaType: mediaTypeEnum("media_type").notNull(),
    postType: postTypeEnum("post_type").notNull().default("public"),
    privacy: privacyEnum("privacy_setting").default("public").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    authorIdx: index("post_author_idx").on(table.authorId),
    recipientIdx: index("post_recipient_idx").on(table.recipientId),
    postTypeIdx: index("post_type_idx").on(table.postType),
    createdAtIdx: index("post_created_at_idx").on(table.createdAt),
  }),
);

export const postRelations = relations(post, ({ one, many }) => ({
  author: one(user, {
    relationName: "author",
    fields: [post.authorId],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [post.recipientId],
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
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const like = pgTable(
  "like",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
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
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
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
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    senderIdx: index("follow_sender_idx").on(table.senderId),
    recipientIdx: index("follow_recipient_idx").on(table.recipientId),
  }),
);

export const followRelations = relations(follow, ({ one }) => ({
  sender: one(user, {
    relationName: "sender",
    fields: [follow.senderId],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [follow.recipientId],
    references: [user.id],
  }),
}));

export const friendRequest = pgTable(
  "friend_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    senderIdx: index("friend_request_sender_idx").on(table.senderId),
    recipientIdx: index("friend_request_recipient_idx").on(table.recipientId),
    uniqueSenderRecipient: uniqueIndex(
      "friend_request_sender_recipient_unique",
    ).on(table.senderId, table.recipientId),
  }),
);

export const friendRequestRelations = relations(friendRequest, ({ one }) => ({
  sender: one(user, {
    relationName: "sender",
    fields: [friendRequest.senderId],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [friendRequest.recipientId],
    references: [user.id],
  }),
}));

export const followRequest = pgTable(
  "follow_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    senderIdx: index("follow_request_sender_idx").on(table.senderId),
    recipientIdx: index("follow_request_recipient_idx").on(table.recipientId),
    uniqueSenderRecipient: uniqueIndex(
      "follow_request_sender_recipient_unique",
    ).on(table.senderId, table.recipientId),
  }),
);

export const followRequestRelations = relations(followRequest, ({ one }) => ({
  sender: one(user, {
    relationName: "sender",
    fields: [followRequest.senderId],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [followRequest.recipientId],
    references: [user.id],
  }),
}));

export const friend = pgTable(
  "friend",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userIdA: uuid("user_id_a")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userIdB: uuid("user_id_b")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
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
    id: uuid("id").primaryKey().defaultRandom(),
    blockedByUserId: uuid("blocked_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    blockedUserId: uuid("blocked_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    blockedUserIdx: index("block_blocking_user_idx").on(table.blockedByUserId),
    blockedByUserIdx: index("block_blocked_user_idx").on(table.blockedUserId),
    uniqueBlockPair: uniqueIndex("block_unique_pair").on(
      table.blockedByUserId,
      table.blockedUserId,
    ),
  }),
);

export const blockRelations = relations(block, ({ one }) => ({
  userWhoIsBlocking: one(user, {
    relationName: "userWhoIsBlocking",
    fields: [block.blockedByUserId],
    references: [user.id],
  }),
  userWhoIsBlocked: one(user, {
    relationName: "userWhoIsBlocked",
    fields: [block.blockedUserId],
    references: [user.id],
  }),
}));

export const reportComment = pgTable(
  "report_comment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reason: reportCommentReasonEnum("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
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
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reason: reportPostReasonEnum("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
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
    id: uuid("id").primaryKey().defaultRandom(),
    reportedUserId: uuid("reported_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reason: reportUserReasonEnum("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
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

export const userRelationship = pgTable(
  "user_relationship",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userIdA: uuid("user_id_a")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userIdB: uuid("user_id_b")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    friendshipStatus: friendStatusEnum("friendship_status")
      .default("notFriends")
      .notNull(),
    followStatus: followStatusEnum("follow_status")
      .default("notFollowing")
      .notNull(),
    blocked: boolean("block_status").default(false).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    selfCheck: check(
      "user_relationship_self_check",
      sql`user_id_a != user_id_b`,
    ),
    userAIdx: index("user_relationship_user_a_idx").on(table.userIdA),
    userBIdx: index("user_relationship_user_b_idx").on(table.userIdB),
    uniqueUserPair: uniqueIndex("user_relationship_user_pair_unique").on(
      table.userIdA,
      table.userIdB,
    ),
  }),
);

export const userRelationshipRelations = relations(
  userRelationship,
  ({ one }) => ({
    userA: one(user, {
      relationName: "userA",
      fields: [userRelationship.userIdA],
      references: [user.id],
    }),
    userB: one(user, {
      relationName: "userB",
      fields: [userRelationship.userIdB],
      references: [user.id],
    }),
  }),
);

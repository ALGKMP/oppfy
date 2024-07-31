import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
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
    return value ? value.toISOString().split("T")[0] ?? null : null;
  },
  fromDriver(value: string | null): Date | null {
    return value ? new Date(value) : null;
  },
});

export const privacySettingEnum = pgEnum("privacy_setting", [
  "public",
  "private",
]);

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

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const reportReasonEnum = pgEnum("report_reason", [
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
  id: text("id").primaryKey(),
  profileId: bigint("profile_id", { mode: "number" })
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  notificationSettingsId: bigint("notification_settings_id", { mode: "number" })
    .notNull()
    .references(() => notificationSettings.id, { onDelete: "cascade" }),
  privacySetting: privacySettingEnum("privacy_setting")
    .default("public")
    .notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(profile, {
    fields: [user.profileId],
    references: [profile.id],
  }),
  notificationSettings: one(notificationSettings, {
    fields: [user.notificationSettingsId],
    references: [notificationSettings.id],
  }),
  postViews: many(postView),
  viewerProfileViews: many(profileView, {
    relationName: "viewerProfileViews",
  }),
  viewedProfileViews: many(profileView, {
    relationName: "viewedProfileViews",
  }),
  receivedNotifications: many(notifications, {
    relationName: "notificationRecipient",
  }),
  sentNotifications: many(notifications, {
    relationName: "notificationSender",
  }),
  pushTokens: many(pushToken),
}));

export const userNotOnApp = pgTable("userNotOnApp", {
  id: uuid("id").primaryKey().defaultRandom(),
  phoneNumber: text("phone_number").notNull(),
  profilePictureKey: text("profile_picture_key"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userNotOnAppRelations = relations(userNotOnApp, ({ many }) => ({
  posts: many(postOfUserNotOnApp),
}));

export const postOfUserNotOnApp = pgTable("postOfUserNotOnApp", {
  id: uuid("id").primaryKey().defaultRandom(),
  phoneNumber: text("phone_number").notNull(),
  author: text("author")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  caption: text("caption").notNull().default(""),
  recipientId: uuid("recipient")
    .notNull()
    .references(() => userNotOnApp.id),
  key: text("key").notNull(),
  width: integer("width").notNull().default(500),
  height: integer("height").notNull().default(500),
  mediaType: mediaTypeEnum("media_type").notNull().default("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const postOfUserNotOnAppRelations = relations(
  postOfUserNotOnApp,
  ({ one }) => ({
    userNotOnApp: one(userNotOnApp, {
      fields: [postOfUserNotOnApp.phoneNumber],
      references: [userNotOnApp.phoneNumber],
    }),
  }),
);

export const contact = pgTable("contact", {
  id: varchar("id", { length: 128 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userContact = pgTable(
  "user_contact",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contactId: varchar("contact_id", { length: 128 })
      .notNull()
      .references(() => contact.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.contactId] }),
  }),
);

export const profile = pgTable("profile", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  fullName: text("full_name"),
  dateOfBirth: dateType("date_of_birth"),
  bio: text("bio"),
  profilePictureKey: text("profile_picture_key")
    .default("profile-pictures/default.jpg")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profileRelations = relations(profile, ({ one, many }) => ({
  user: one(user, {
    fields: [profile.id],
    references: [user.profileId],
  }),
  profileStats: one(profileStats, {
    fields: [profile.id],
    references: [profileStats.profileId],
  }),
}));

export const profileStats = pgTable("profile_stats", {
  id: serial("id").primaryKey(),
  profileId: bigint("profile_id", { mode: "number" })
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  followers: integer("followers").notNull().default(0),
  following: integer("following").notNull().default(0),
  friends: integer("friends").notNull().default(0),
  posts: integer("posts").notNull().default(0),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profileStatsRelations = relations(profileStats, ({ one }) => ({
  profile: one(profile, {
    fields: [profileStats.profileId],
    references: [profile.id],
  }),
}));

export const profileView = pgTable("profile_view", {
  id: serial("id").primaryKey(),
  viewerUserId: text("viewer_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  viewedUserId: text("viewed_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profileViewRelations = relations(profileView, ({ one }) => ({
  viewer: one(user, {
    relationName: "viewerProfileViews",
    fields: [profileView.viewerUserId],
    references: [user.id],
  }),
  viewedProfile: one(user, {
    relationName: "viewedProfileViews",
    fields: [profileView.viewedUserId],
    references: [user.id],
  }),
}));

export const pushToken = pgTable(
  "push_token",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniquePushToken: uniqueIndex("unique_push_token").on(table.token),
  }),
);

export const pushTokenRelations = relations(pushToken, ({ one }) => ({
  user: one(user, {
    fields: [pushToken.userId],
    references: [user.id],
  }),
}));

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  recipientId: text("recipient_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  read: boolean("read").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  entityId: text("entity_id"),
  entityType: entityTypeEnum("entity_type"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
  id: serial("id").primaryKey(),
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

export const post = pgTable("post", {
  id: serial("id").primaryKey(),
  author: text("author")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  recipient: text("recipient")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  caption: text("caption").notNull().default(""),
  key: text("key").notNull(),
  width: integer("width").notNull().default(500),
  height: integer("height").notNull().default(500),
  mediaType: mediaTypeEnum("media_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const postRelations = relations(post, ({ one, many }) => ({
  author: one(user, {
    relationName: "author",
    fields: [post.author],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [post.recipient],
    references: [user.id],
  }),
  postStats: one(postStats, {
    fields: [post.id],
    references: [postStats.postId],
  }),
  views: many(postView),
  likes: many(like),
  comments: many(comment),
}));

export const postView = pgTable("post_view", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  postId: bigint("post_id", { mode: "number" })
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const postViewRelation = relations(postView, ({ one }) => ({
  post: one(post, {
    fields: [postView.postId],
    references: [post.id],
  }),
  user: one(user, {
    fields: [postView.userId],
    references: [user.id],
  }),
}));

export const postStats = pgTable("post_stats", {
  id: serial("id").primaryKey(),
  postId: bigint("post_id", { mode: "number" })
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const postStatsRelations = relations(postStats, ({ one }) => ({
  post: one(post, {
    fields: [postStats.postId],
    references: [post.id],
  }),
}));

export const like = pgTable("like", {
  id: serial("id").primaryKey(),
  postId: bigint("post_id", { mode: "number" })
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const likeRelations = relations(like, ({ one }) => ({
  post: one(post, {
    fields: [like.postId],
    references: [post.id],
  }),
  likedBy: one(user, {
    fields: [like.user],
    references: [user.id],
  }),
}));

export const comment = pgTable("comment", {
  id: serial("id").primaryKey(),
  user: text("user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  post: bigint("post_id", { mode: "number" })
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const commentRelations = relations(comment, ({ one }) => ({
  post: one(post, {
    fields: [comment.post],
    references: [post.id],
  }),
  commentedBy: one(user, {
    fields: [comment.user],
    references: [user.id],
  }),
}));

export const follower = pgTable("follower", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  recipientId: text("recipient_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const followerRelations = relations(follower, ({ one }) => ({
  sender: one(user, {
    relationName: "sender",
    fields: [follower.senderId],
    references: [user.id],
  }),
  recipient: one(user, {
    relationName: "recipient",
    fields: [follower.recipientId],
    references: [user.id],
  }),
}));

export const friendRequest = pgTable("friend_request", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  recipientId: text("recipient_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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

export const followRequest = pgTable("follow_request", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  recipientId: text("recipient_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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

export const friend = pgTable("friend", {
  id: serial("id").primaryKey(),
  userId1: text("user_id_1")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  userId2: text("user_id_2")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const friendRelations = relations(friend, ({ one }) => ({
  user1: one(user, {
    relationName: "user1",
    fields: [friend.userId1],
    references: [user.id],
  }),
  user2: one(user, {
    relationName: "user2",
    fields: [friend.userId2],
    references: [user.id],
  }),
}));

export const block = pgTable("blocked", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  blockedUserId: text("blocked_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const blockRelations = relations(block, ({ one }) => ({
  user: one(user, {
    relationName: "user",
    fields: [block.userId],
    references: [user.id],
  }),
  blockedUser: one(user, {
    relationName: "blockedUser",
    fields: [block.blockedUserId],
    references: [user.id],
  }),
}));

export const reportComment = pgTable("report_comment", {
  id: serial("id").primaryKey(),
  commentId: bigint("comment_id", { mode: "number" })
    .notNull()
    .references(() => comment.id, { onDelete: "cascade" }),
  reporterUserId: text("reporter_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reason: reportReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reportPost = pgTable("report_post", {
  id: serial("id").primaryKey(),
  postId: bigint("post_id", { mode: "number" })
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),
  reporterUserId: text("reporter_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reason: reportReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reportUser = pgTable("report_profile", {
  id: serial("id").primaryKey(),
  targetUserId: text("target_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reporterUserId: text("reporter_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reason: reportUserReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reportCommentRelations = relations(reportComment, ({ one }) => ({
  comment: one(comment, {
    fields: [reportComment.commentId],
    references: [comment.id],
  }),
  reporter: one(user, {
    fields: [reportComment.reporterUserId],
    references: [user.id],
  }),
}));

export const reportPostRelations = relations(reportPost, ({ one }) => ({
  post: one(post, {
    fields: [reportPost.postId],
    references: [post.id],
  }),
  reporter: one(user, {
    fields: [reportPost.reporterUserId],
    references: [user.id],
  }),
}));

export const reportProfileRelations = relations(reportUser, ({ one }) => ({
  profile: one(user, {
    fields: [reportUser.targetUserId],
    references: [user.id],
  }),
  reporter: one(user, {
    fields: [reportUser.reporterUserId],
    references: [user.id],
  }),
}));

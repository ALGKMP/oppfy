import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varbinary,
  varchar,
} from "drizzle-orm/mysql-core";

import { mySqlTable } from "./_table";

export const user = mySqlTable("User", {
  id: varchar("id", { length: 255 }).primaryKey(),
  profileId: bigint("profile", { mode: "number", unsigned: true })
    .references(() => profile.id)
    .notNull(),
  notificationSettingsId: bigint("notificationSettingsId", {
    mode: "number",
    unsigned: true,
  })
    .references(() => notificationSettings.id, { onDelete: "cascade" })
    .notNull(),
  privacySetting: mysqlEnum("privacySetting", ["public", "private"])
    .default("public")
    .notNull(),
  pushToken: varchar("pushToken", { length: 255 }),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const contact = mysqlTable("Contact", {
  id: varbinary("id", { length: 512 }).primaryKey(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
});

export const userContact = mysqlTable(
  "UserContact",
  {
    userId: varchar("userId", { length: 255 })
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    contactId: varbinary("contactId", { length: 512 })
      .references(() => contact.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("createdAt")
      .default(sql`CURRENT_TIMESTAMP`)
      .onUpdateNow()
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.contactId] }),
    };
  },
);

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(profile, {
    fields: [user.profileId],
    references: [profile.id],
  }),
  notificationSettings: one(notificationSettings, {
    fields: [user.notificationSettingsId],
    references: [notificationSettings.id],
  }),
  notifications: many(notifications),
}));

export const profile = mySqlTable("Profile", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).unique(),
  fullName: varchar("fullName", { length: 255 }),
  dateOfBirth: date("dateOfBirth"),
  bio: text("bio"),
  profilePictureKey: varchar("profilePictureKey", { length: 255 })
    .default("profile-pictures/default.jpg")
    .notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const notifications = mySqlTable("Notifications", {
  id: serial("id").primaryKey(),

  senderId: varchar("senderId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  recipientId: varchar("recipientId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),

  read: boolean("read").default(false).notNull(),

  eventType: mysqlEnum("eventType", [
    "like",
    "post",
    "comment",
    "follow",
    "friend",
    "followRequest",
    "friendRequest",
  ]).notNull(),

  entityId: varchar("entityId", { length: 255 }),
  entityType: mysqlEnum("type", ["post", "profile", "comment"]),

  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(user, {
    fields: [notifications.recipientId],
    references: [user.id],
  }),
}));

export const notificationSettings = mySqlTable("NotificationSettings", {
  id: serial("id").primaryKey(),
  posts: boolean("posts").default(true).notNull(),
  likes: boolean("likes").default(true).notNull(),
  mentions: boolean("mentions").default(true).notNull(),
  comments: boolean("comments").default(true).notNull(),
  followRequests: boolean("followRequests").default(true).notNull(),
  friendRequests: boolean("friendRequests").default(true).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const post = mySqlTable("Post", {
  id: serial("id").primaryKey(),
  author: varchar("author", { length: 255 })
    .references(() => user.id)
    .notNull(),
  recipient: varchar("recipient", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  caption: text("caption").default("").notNull(),
  key: varchar("url", { length: 255 }).notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"])
    .notNull()
    .default("image"),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
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
  stats: one(postStats, {
    fields: [post.id],
    references: [postStats.postId],
  }),
  likes: many(like),
  comments: many(comment),
}));

export const postStats = mySqlTable("PostStats", {
  id: serial("id").primaryKey(),
  postId: bigint("postId", { mode: "number", unsigned: true })
    .references(() => post.id, { onDelete: "cascade" })
    .notNull(),
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  views: int("views").default(0).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const postStatsRelations = relations(postStats, ({ one }) => ({
  post: one(post, {
    fields: [postStats.postId],
    references: [post.id],
  }),
}));

export const like = mySqlTable("Like", {
  id: serial("id").primaryKey(),
  postId: bigint("postId", { mode: "number", unsigned: true })
    .references(() => post.id, { onDelete: "cascade" })
    .notNull(),
  user: varchar("user", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
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

export const comment = mySqlTable("Comment", {
  id: serial("id").primaryKey(),
  user: varchar("user", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  post: bigint("postId", { mode: "number", unsigned: true })
    .references(() => post.id, { onDelete: "cascade" })
    .notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const commentRelations = relations(comment, ({ one }) => ({
  post: one(post, {
    fields: [comment.post],
    references: [post.id],
  }),
  commenetedBy: one(user, {
    fields: [comment.user],
    references: [user.id],
  }),
}));

export const follower = mySqlTable("Follower", {
  id: serial("id").primaryKey(),
  senderId: varchar("senderId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  recipientId: varchar("recipientId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
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

export const friendRequest = mySqlTable("FriendRequest", {
  id: serial("id").primaryKey(),
  senderId: varchar("senderId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  recipientId: varchar("recipientId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
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

export const followRequest = mySqlTable("FollowRequest", {
  id: serial("id").primaryKey(),
  senderId: varchar("senderId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  recipientId: varchar("recipientId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const followRequestRelation = relations(followRequest, ({ one }) => ({
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

export const friend = mySqlTable("Friend", {
  id: serial("id").primaryKey(),
  userId1: varchar("userId1", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  userId2: varchar("userId2", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
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

export const block = mySqlTable("Blocked", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  blockedUserId: varchar("blockedUserId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
});

export const blockRelation = relations(block, ({ one }) => ({
  userId: one(user, {
    relationName: "userId",
    fields: [block.userId],
    references: [user.id],
  }),
  blockedUserId: one(user, {
    relationName: "blockedUserId",
    fields: [block.blockedUserId],
    references: [user.id],
  }),
}));

export const reportPost = mySqlTable("ReportPost", {
  id: serial("id").primaryKey(),
  postId: bigint("postId", { mode: "number", unsigned: true })
    .references(() => post.id, { onDelete: "cascade" })
    .notNull(),
  reporterUserId: varchar("reporterUserId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  reason: mysqlEnum("reason", [
    "It offends me",
    "Nudity or sexual activity",
    "Hate speech or symbols",
    "Bullying or harassment",
  ]).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
});

export const reportProfile = mySqlTable("ReportProfile", {
  id: serial("id").primaryKey(),
  targetUserId: varchar("targetUserId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  reporterUserId: varchar("reporterUsdId", { length: 255 })
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  reason: mysqlEnum("reason", [
    "Posting explicit content",
    "Under the age of 13",
    "Catfish account",
    "Scam/spam account",
  ]).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
});

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

export const reportProfileRelations = relations(reportProfile, ({ one }) => ({
  profile: one(user, {
    fields: [reportProfile.targetUserId],
    references: [user.id],
  }),
  reporter: one(user, {
    fields: [reportProfile.reporterUserId],
    references: [user.id],
  }),
}));

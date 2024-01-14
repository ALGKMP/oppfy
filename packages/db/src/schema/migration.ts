import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  datetime,
  int,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { mySqlTable } from "./_table";

export const verificationToken = mySqlTable("VerificationToken", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expires: datetime("expires").notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const user = mySqlTable("User", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: date("dateOfBirth").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  profileId: int("profileId").references(() => profile.id),
  notificationSetting: int("notificationSetting").references(
    () => notificationSetting.id,
  ),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const userRelations = relations(user, ({ one }) => ({
  profile: one(profile, {
    fields: [user.profileId],
    references: [profile.id],
  }),
  notificationSetting: one(notificationSetting, {
    fields: [user.notificationSetting],
    references: [notificationSetting.id],
  }),
}));

export const notificationSetting = mySqlTable("NotificationSetting", {
  id: serial("id").primaryKey(),
  email: boolean("email").default(true).notNull(),
  push: boolean("push").default(true).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const profile = mySqlTable("Profile", {
  id: serial("id").primaryKey(),
  bio: text("bio"),
  profilePhotoId: int("profilePhoto").references(() => profilePhoto.id),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const profileRelations = relations(profile, ({ one }) => ({
  profilePhoto: one(profilePhoto, {
    fields: [profile.profilePhotoId],
    references: [profilePhoto.id],
  }),
  user: one(user, {
    fields: [profile.id],
    references: [user.profileId],
  }),
}));

export const profilePhoto = mySqlTable("ProfilePhoto", {
  id: serial("id").primaryKey(),
  url: varchar("url", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const profilePhotoRelations = relations(profilePhoto, ({ one }) => ({
  profile: one(profile, {
    fields: [profilePhoto.id],
    references: [profile.id],
  }),
}));

export const post = mySqlTable("Post", {
  id: serial("id").primaryKey(),
  authorId: int("authorId")
    .references(() => profile.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  url: varchar("url", { length: 255 }),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const postRelations = relations(post, ({ one }) => ({
  author: one(profile, {
    fields: [post.authorId],
    references: [profile.id],
  }),
}));

export const postStats = mySqlTable("PostStats", {
  id: serial("id").primaryKey(),
  postId: int("postId")
    .references(() => post.id)
    .notNull(),
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  views: int("views").default(0).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const postStatsRelations = relations(postStats, ({one}) => ({
  post: one(post, {
    fields: [postStats.postId],
    references: [post.id],
    }),
}));

export const tag = mySqlTable("Tag", {
  id: serial("id").primaryKey(),
  profileId: int("profileId")
    .references(() => profile.id)
    .notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const tagRelations = relations(tag, ({ one }) => ({
  profile: one(profile, {
    fields: [tag.profileId],
    references: [profile.id],
  }),
}));

export const like = mySqlTable("Like", {
  id: serial("id").primaryKey(),
  postId: int("postId")
    .references(() => post.id)
    .notNull(),
  profileId: int("profileId")
    .references(() => profile.id)
    .notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const likeRelations = relations(like, ({ one }) => ({
  post: one(post, {
    fields: [like.postId],
    references: [post.id],
  }),
  likedBy: one(profile, {
    fields: [like.profileId],
    references: [profile.id],
  }),
}));

export const comment = mySqlTable("Comment", {
  id: serial("id").primaryKey(),
  userId: int("userId")
    .references(() => user.id)
    .notNull(),
  postId: int("postId")
    .references(() => post.id)
    .notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const commentRelations = relations(comment, ({ one }) => ({
  post: one(post, {
    fields: [comment.postId],
    references: [post.id],
  }),
  commenetedBy: one(user, {
    fields: [comment.userId],
    references: [user.id],
  })
}));


import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  datetime,
  int,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// import { mySqlTable } from "@acme/db/src/schema/_table";
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
  id: varchar("id", {length: 255}).primaryKey(),
  // email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }),
  dateOfBirth: date("dateOfBirth"),
  profileId: bigint("profileId", {mode: "number", unsigned: true}).references(() => profile.id),
  notificationSetting: bigint("notificationSetting", {mode: "number", unsigned: true}).references(
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

export const profile = mySqlTable("Profile", {
  id: serial("id").primaryKey(),
  userName: varchar("userName", { length: 255 }).unique().notNull(),
  bio: text("bio"),
  profilePhotoId: bigint("profilePhoto", {mode: "number", unsigned: true}).references(() => profilePhoto.id),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const profileRelations = relations(profile, ({ one, many }) => ({
  authoredPosts: many(post),
  receivedPosts: many(post),
  profilePhoto: one(profilePhoto, {
    fields: [profile.profilePhotoId],
    references: [profilePhoto.id],
  }),
}));

export const profilePhoto = mySqlTable("ProfilePhoto", {
  id: serial("id").primaryKey().notNull(),
  key: varchar("url", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const notificationSetting = mySqlTable("NotificationSetting", {
  id: serial("id").primaryKey(),
  posts: boolean("posts").default(true).notNull(),
  mentions: boolean("mentions").default(true).notNull(),
  comments: boolean("comments").default(true).notNull(),
  friendRequests: boolean("friendRequests").default(true).notNull(),
  createdAt: timestamp("createdAt")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});

export const post = mySqlTable("Post", {
  id: serial("id").primaryKey(),
  authorId: bigint("authorId", {mode: "number", unsigned: true})
    .references(() => profile.id)
    .notNull(),
  recipientProfileId: bigint("recipientProfileId", {mode: "number", unsigned: true})
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


export const postRelations = relations(post, ({ one, many }) => ({
  author: one(profile, {
    fields: [post.authorId],
    references: [profile.id],
  }),
  recipient: one(profile, {
    fields: [post.recipientProfileId],
    references: [profile.id],
  }),
  stats: one(postStats, {
    fields: [post.id],
    references: [postStats.postId],
  }),
  likes: many(like),
  comments: many(comment),
  tags: many(tag)
}));

export const postStats = mySqlTable("PostStats", {
  id: serial("id").primaryKey(),
  postId: bigint("postId", {mode: "number", unsigned: true})
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
  profileId: bigint("profileId", {mode: "number", unsigned: true})
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
  post: one(post, {
    fields: [tag.id],
    references: [post.id],
  }),
}));

export const like = mySqlTable("Like", {
  id: serial("id").primaryKey(),
  postId: bigint("postId", {mode: "number", unsigned: true})
    .references(() => post.id)
    .notNull(),
  profileId: bigint("profileId", {mode: "number", unsigned: true})
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
  userId: varchar("userId", {length: 255})
    .references(() => user.id)
    .notNull(),
  postId: bigint("postId", {mode: "number", unsigned: true})
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


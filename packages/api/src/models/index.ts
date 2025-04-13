import type { InferInsertModel, InferSelectModel, schema } from "@oppfy/db";

export type MediaType = (typeof schema.mediaTypeEnum.enumValues)[number];
export type PostStatus = (typeof schema.postStatusEnum.enumValues)[number];

export type ReportUserReason =
  (typeof schema.reportUserReasonEnum.enumValues)[number];
export type ReportPostReason =
  (typeof schema.reportPostReasonEnum.enumValues)[number];
export type ReportCommentReason =
  (typeof schema.reportCommentReasonEnum.enumValues)[number];

export type User = InferSelectModel<typeof schema.user>;

type BaseProfile = InferSelectModel<typeof schema.profile>;
export type ProfileState = "onboarded" | undefined;

export type Profile<TState extends ProfileState = undefined> =
  TState extends "onboarded"
    ? {
        [K in keyof BaseProfile]: K extends "profilePictureKey"
          ? BaseProfile[K]
          : NonNullable<BaseProfile[K]>;
      }
    : BaseProfile;

export type Block = InferSelectModel<typeof schema.block>;

export type Follow = InferSelectModel<typeof schema.follow>;
export type Friend = InferSelectModel<typeof schema.friend>;

export type FollowRequest = InferSelectModel<typeof schema.followRequest>;
export type FriendRequest = InferSelectModel<typeof schema.friendRequest>;

export type UserStatus = InferSelectModel<typeof schema.userStatus>;
export type UserStats = InferSelectModel<typeof schema.userStats>;

export type Post = InferSelectModel<typeof schema.post>;
export type PostStats = InferSelectModel<typeof schema.postStats>;

export type Comment = InferSelectModel<typeof schema.comment>;
export type Like = InferSelectModel<typeof schema.like>;

export type ReportUser = InferSelectModel<typeof schema.reportUser>;
export type ReportPost = InferSelectModel<typeof schema.reportPost>;
export type ReportComment = InferSelectModel<typeof schema.reportComment>;

export type Notification = InferSelectModel<typeof schema.notification>;
export type NotificationSettings = InferSelectModel<
  typeof schema.notificationSettings
>;

export type UserInsert = InferInsertModel<typeof schema.user>;
export type UserStatusInsert = InferInsertModel<typeof schema.userStatus>;
export type ProfileInsert = InferInsertModel<typeof schema.profile>;
export type ProfileStatsInsert = InferInsertModel<typeof schema.userStats>;
export type PostInsert = InferInsertModel<typeof schema.post>;
export type PostStatsInsert = InferInsertModel<typeof schema.postStats>;

import type {
  InferInsertModel,
  InferSelectModel,
  NotificationSettings,
  schema,
} from "@oppfy/db";

import type {
  reportCommentReasonEnum,
  reportPostReasonEnum,
  reportUserReasonEnum,
} from "../../../../db/src/schema";

export type ReportUserReason = (typeof reportUserReasonEnum.enumValues)[number];
export type ReportPostReason = (typeof reportPostReasonEnum.enumValues)[number];
export type ReportCommentReason =
  (typeof reportCommentReasonEnum.enumValues)[number];

export type User = InferSelectModel<typeof schema.user>;
export type Profile = InferSelectModel<typeof schema.profile>;
export type Block = InferSelectModel<typeof schema.block>;
export type Follow = InferSelectModel<typeof schema.follow>;
export type FollowRequest = InferSelectModel<typeof schema.followRequest>;
export type Friend = InferSelectModel<typeof schema.friend>;
export type FriendRequest = InferSelectModel<typeof schema.friendRequest>;
export interface BlockWithProfile {
  block: Block;
  profile: Profile;
}
export type UserWithProfile = User & {
  profile: Profile;
};
export type HydratedProfile = Profile & {
  profilePictureUrl: string | null;
};
export type UserWithNotificationSettings = User & {
  notificationSettings: NotificationSettings;
};
export type UserStatus = InferSelectModel<typeof schema.userStatus>;
export type UserStats = InferSelectModel<typeof schema.userStats>;
export type Post = InferSelectModel<typeof schema.post>;

export type PostStats = InferSelectModel<typeof schema.postStats>;
export type Comment = InferSelectModel<typeof schema.comment>;
export type Like = InferSelectModel<typeof schema.like>;
export type ReportUser = InferSelectModel<typeof schema.reportUser>;
export type ReportPost = InferSelectModel<typeof schema.reportPost>;
export type ReportComment = InferSelectModel<typeof schema.reportComment>;

export type UserInsert = InferInsertModel<typeof schema.user>;
export type ProfileInsert = InferInsertModel<typeof schema.profile>;
export type UserStatusInsert = InferInsertModel<typeof schema.userStatus>;
export type ProfileStatsInsert = InferInsertModel<typeof schema.userStats>;
export type PostInsert = InferInsertModel<typeof schema.post>;
export type PostStatsInsert = InferInsertModel<typeof schema.postStats>;

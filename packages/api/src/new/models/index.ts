import { InferSelectModel, schema } from "@oppfy/db";

import {
  reportCommentReasonEnum,
  reportPostReasonEnum,
  reportUserReasonEnum,
} from "../../../../db/src/schema";

export type ReportUserReason = (typeof reportUserReasonEnum.enumValues)[number];
export type ReportPostReason = (typeof reportPostReasonEnum.enumValues)[number];
export type ReportCommentReason =
  (typeof reportCommentReasonEnum.enumValues)[number];

export type User = InferSelectModel<typeof schema.user>;
export type UserStatus = InferSelectModel<typeof schema.userStatus>;
export type Profile = InferSelectModel<typeof schema.profile>;
export type ProfileStats = InferSelectModel<typeof schema.profileStats>;
export type Post = InferSelectModel<typeof schema.post>;
export type PostStats = InferSelectModel<typeof schema.postStats>;
export type Comment = InferSelectModel<typeof schema.comment>;
export type Like = InferSelectModel<typeof schema.like>;
export type ReportUser = InferSelectModel<typeof schema.reportUser>;
export type ReportPost = InferSelectModel<typeof schema.reportPost>;
export type ReportComment = InferSelectModel<typeof schema.reportComment>;

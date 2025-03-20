import type { Result } from "neverthrow";

import type {
  ReportCommentReason,
  ReportPostReason,
  ReportUserReason,
} from "../../../models";

export interface CreatePostReportParams {
  reason: ReportPostReason;
  postId: string;
  reporterUserId: string;
}

export interface CreateUserReportParams {
  reason: ReportUserReason;
  reportedUserId: string;
  reporterUserId: string;
}

export interface CreateCommentReportParams {
  reason: ReportCommentReason;
  commentId: string;
  reporterUserId: string;
}

export interface IReportService {
  reportUser(params: CreateUserReportParams): Promise<Result<void, never>>;
  reportPost(params: CreatePostReportParams): Promise<Result<void, never>>;
  reportComment(
    params: CreateCommentReportParams,
  ): Promise<Result<void, never>>;
}

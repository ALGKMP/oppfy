import type { DatabaseOrTransaction } from "@oppfy/db";

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

export interface IReportRepository {
  createUserReport(
    params: CreateUserReportParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  createPostReport(
    params: CreatePostReportParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  createCommentReport(
    params: CreateCommentReportParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;
}

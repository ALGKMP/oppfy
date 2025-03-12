import type { Transaction } from "@oppfy/db";

import type {
  ReportCommentReason,
  ReportPostReason,
  ReportUserReason,
} from "../../models";

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
    tx?: Transaction,
  ): Promise<void>;
  createPostReport(
    params: CreatePostReportParams,
    tx?: Transaction,
  ): Promise<void>;
  createCommentReport(
    params: CreateCommentReportParams,
    tx?: Transaction,
  ): Promise<void>;
}

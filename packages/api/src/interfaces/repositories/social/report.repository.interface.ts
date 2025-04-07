import type { DatabaseOrTransaction } from "@oppfy/db";

import type {
  ReportCommentReason,
  ReportPostReason,
  ReportUserReason,
} from "../../../models";

// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
type ReportReason = ReportUserReason | ReportPostReason | ReportCommentReason;

export interface ReportParams<T extends ReportReason> {
  reason: T;
  userId: string;
}

export type CreateUserReportParams = ReportParams<ReportUserReason> & {
  reportedUserId: string;
};

export type CreatePostReportParams = ReportParams<ReportPostReason> & {
  reportedPostId: string;
};

export type CreateCommentReportParams = ReportParams<ReportCommentReason> & {
  reportedCommentId: string;
};

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

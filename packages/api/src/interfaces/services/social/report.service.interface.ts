import type { Result } from "neverthrow";

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

export interface IReportService {
  reportUser(params: CreateUserReportParams): Promise<Result<void, never>>;
  reportPost(params: CreatePostReportParams): Promise<Result<void, never>>;
  reportComment(
    params: CreateCommentReportParams,
  ): Promise<Result<void, never>>;
}

import {
  CreateCommentReportParams,
  CreatePostReportParams,
  CreateUserReportParams,
  IReportService,
} from "../interfaces/services/i-report-service";
import { ReportRepository } from "../repositories/report.repository";

export class ReportService implements IReportService {
  private reportRepository = new ReportRepository();

  async reportUser(params: CreateUserReportParams): Promise<void> {
    await this.reportRepository.createUserReport(params);
  }
  async reportPost(params: CreatePostReportParams): Promise<void> {
    await this.reportRepository.createPostReport(params);
  }
  async reportComment(params: CreateCommentReportParams): Promise<void> {
    await this.reportRepository.createCommentReport(params);
  }
}

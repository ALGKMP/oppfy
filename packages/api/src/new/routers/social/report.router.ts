import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { createTRPCRouter, protectedProcedure } from "../../../trpc";
import { container, TYPES } from "../../container";
import type { IReportService } from "../../interfaces/services/social/report.service.interface";

const reportService = container.get<IReportService>(TYPES.ReportService);

export const reportRouter = createTRPCRouter({
  reportUser: protectedProcedure
    .input(
      z.object({
        reportedUserId: z.string(),
        reason: sharedValidators.report.reportUserOptions,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await reportService.reportUser({
        userId: ctx.session.uid,
        ...input,
      });
    }),

  reportPost: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        reason: sharedValidators.report.reportPostOptions,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await reportService.reportPost({
        ...input,
        userId: ctx.session.uid,
      });
    }),

  reportComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        reason: sharedValidators.report.reportCommentOptions,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await reportService.reportComment({
        ...input,
        userId: ctx.session.uid,
      });
    }),
});

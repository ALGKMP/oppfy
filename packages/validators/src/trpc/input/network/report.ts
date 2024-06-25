import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

const trpcReportInputSchema = {
  reportProfile: z.object({
    targetUserId: z.string(),
    reason: sharedValidators.report.reportUserOptions,
  }),

  reportPost: z.object({
    postId: z.number(),
    reason: sharedValidators.report.reportPostOptions,
  }),

  reportComment: z.object({
    commentId: z.number(),
    reason: sharedValidators.report.reportCommentOptions,
  }),
};

export default trpcReportInputSchema;

import { z } from "zod";

import {
  reportCommentOptions,
  reportPostOptions,
  reportUserOptions,
} from "../../../shared";

const trpcReportInputSchema = {
  reportUser: z.object({
    targetUserId: z.string(),
    reason: reportUserOptions,
  }),

  reportPost: z.object({
    postId: z.number(),
    reason: reportPostOptions,
  }),

  reportComment: z.object({
    commentId: z.number(),
    reason: reportCommentOptions,
  }),
};

export default trpcReportInputSchema;

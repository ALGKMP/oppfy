import { z } from "zod";

export const reportProfileOptions = z.enum([
  "Posting explicit content",
  "Under the age of 13",
  "Catfish account",
  "Scam/spam account",
]);

export const reportPostOptions = z.enum([
  "It offends me",
  "Nudity or sexual activity",
  "Hate speech or symbols",
  "Bullying or harassment",
]);

const trpcReportInputSchema = {
  reportProfile: z.object({
    targetUserId: z.string(),
    reason: reportProfileOptions,
  }),

  reportPost: z.object({
    postId: z.number(),
    reason: reportPostOptions,
  }),
};

export default trpcReportInputSchema;

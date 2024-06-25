import { z } from "zod";

export const reportPostOptions = z.enum([
  "Violent or abusive",
  "Sexually explicit or predatory",
  "Hate, harassment or bullying",
  "Suicide and self-harm",
  "Spam or scam",
  "Other",
]);

export const reportCommentOptions = z.enum([
  "Violent or abusive",
  "Sexually explicit or predatory",
  "Hate, harassment or bullying",
  "Suicide and self-harm",
  "Spam or scam",
  "Other",
]);

export const reportUserOptions = z.enum([
  "Posting explicit content",
  "Under the age of 13",
  "Catfish account",
  "Scam/spam account",
]);

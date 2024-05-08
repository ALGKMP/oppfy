import { z } from "zod";
import { userId } from "./user";

export const profilePictureKey = z.string().regex(/^(profile-pictures\/).*/);
export const postKey = z.string().regex(/^(posts\/).*/);
// TODO: Inherrit type from trpc route instead of defining it here
export const post = z.object({
  id: z.number(),
  authorsId: userId,
  authorUsername: z.string(),
  friendsUsername: z.string(),
  friendsId: userId,
  caption: z.string(),
  url: z.string(),
});
export const posts = z.array(post);

export const postId = z.number();
export const contentType = z.string();
export const contentLength = z.number();
export const caption = z.string();

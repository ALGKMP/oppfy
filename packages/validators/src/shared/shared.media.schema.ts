import { z } from "zod";

export const profilePictureKey = z.string().regex(/^(profile-pictures\/).*/);
export const postKey = z.string().regex(/^(posts\/).*/);
export const post = z.object({
  id: z.number(),
  url: z.string(),
});
export const userPosts = z.array(post);

export const postId = z.number();
export const contentType = z.string();
export const contentLength = z.number();
export const caption = z.string();

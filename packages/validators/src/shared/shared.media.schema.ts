import { z } from "zod";

export const profilePictureKey = z.string().regex(/^(profile-pictures\/).*/);
export const postKey = z.string().regex(/^(posts\/).*/);

export const postId = z.number();
export const contentType = z.string();
export const contentLength = z.number();
export const caption = z.string();


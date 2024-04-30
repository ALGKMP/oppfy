import { z } from "zod";

export const userId = z.string().min(1);
export const profileId = z.number().int();
export const fullName = z.string().min(1);
export const username = z.string().min(1);
export const dateOfBirth = z.date();

export const key = z
  .string()
  .regex(
    /^(profile-pictures\/|posts\/).*/,
    "Key must start with 'profile-pictures/' or 'posts/'.",
  );

export const postId = z.number();
export const contentType = z.string();
export const contentLength = z.number();
export const caption = z.string();
export const author = z.string();
export const friend = z.string();

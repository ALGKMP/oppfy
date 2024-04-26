import {z} from "zod"

export const userId = z.string().min(1);
export const name = z.string().min(1);
export const username = z.string().min(1);
export const dateOfBirth = z.date();
export const key= z.string().regex(/^(profile-pictures\/|posts\/).*/, "Key must start with 'profile-pictures/' or 'posts/'.")



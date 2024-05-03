import type { CountryCode } from "libphonenumber-js";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

import { AgeChecker } from "@acme/utils";

export const userId = z.string();
export const profileId = z.string();

export const fullName = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z]+([ '-][a-zA-Z]+)*$/);

export const username = z.string().min(1);

export const dateOfBirth = z
  .date()
  .refine((date) =>
    new AgeChecker(date).isAtLeast(13).isAtMost(100).checkValid(),
  );

export const phoneNumber = z
  .object({
    phoneNumber: z.string(),
    countryCode: z.string(),
  })
  .refine((data) =>
    isValidPhoneNumber(data.phoneNumber, data.countryCode as CountryCode),
  );

export const phoneNumberOTP = z.string().length(6);

// export const profileData = z.object({
//     userId: z.string(),
//     username: z.string(),
//     bio: z.string().optional(),
//     profilePhotoUrl: z.string().optional(),
//     posts: z.array(z.object({
//       postId: z.number(),
//       caption: z.string(),
//       imageUrl: z.string(),
//       createdAt: z.string(),
//       likes: z.number(),
//       comments: z.number(),
//     })),
//     followersCount: z.number(),
//     followingCount: z.number(),
//   });

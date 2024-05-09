import type { CountryCode } from "libphonenumber-js";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

import { AgeChecker } from "@acme/utils";

export const userId = z.string();
export const profileId = z.string();
export const profilePicture = z.union([z.string(), z.null()]);

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

export const blockedUser = z.object({
  userId: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  profilePictureUrl: z.string(),
  createdAt: z.date(),
  profileId: z.number(),
});

export const paginatedBlockedUsers = z.object({
  items:z.array(blockedUser),
  nextCursor : z.object({
    createdAt: z.date(),
    profileId: z.number(),
  }).nullable()
});

// Use this for displaying profile header
export const basicProfile = z.object({
  userId: z.string(),
  privacy: z.enum(["public", "private"]),
  username: z.string(),
  name: z.string(),
  profilePictureUrl: z.string(),
});

export const fullProfile = z.object({
  userId: z.string(),
  privacy: z.enum(["public", "private"]),
  username: z.string(),
  name: z.string(),
  bio: z.union([z.string(), z.null()]),
  followerCount: z.number(),
  followingCount: z.number(),
  friendCount: z.number(),
  profilePictureUrl: z.string(),
});

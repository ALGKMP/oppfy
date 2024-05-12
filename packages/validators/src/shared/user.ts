import type { CountryCode } from "libphonenumber-js";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

import { AgeChecker } from "@acme/utils";

export const userId = z.string();
export const profileId = z.string();
export const profilePicture = z.union([z.string(), z.null()]);

export const fullName = z
  .string()
  .min(3, { message: "Name is too short" })
  .max(50, { message: "Name is too long" })
  .regex(/^[a-zA-Z]+([ '-][a-zA-Z]+)*$/, {
    message: "Name contains invalid characters",
  });

export const username = z
  .string()
  .min(1, { message: "Username is too short" })
  .max(20, { message: "Username is too long" });

export const bio = z.string().max(160, { message: "Bio is too long" });

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

export const updateProfile = z.object({
  username: z.string().optional(),
  name: z.string().optional(),
  bio: z.string().optional(),
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

// Define a schema for a single user profile
const userHeaderSchema = z.object({
  userId: z.string(),
  username: z.string(),
  name: z.string(),
  profilePictureUrl: z.string(),
});

// Define a schema for the cursor used in pagination
const cursorSchema = z.object({
  createdAt: z.date(),
  profileId: z.number(),
});

// Define a schema for the paginated response
export const paginatedUserResponseSchema = z.object({
  items: z.array(userHeaderSchema),
  nextCursor: cursorSchema.nullable(),
});




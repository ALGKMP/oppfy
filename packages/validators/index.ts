import type { CountryCode } from "libphonenumber-js";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

import { AgeChecker } from "./utils";

export const validators = {
  name: z
    .string()
    .min(1, { message: "Name is too short" })
    .max(50, { message: "Name is too long" })
    .regex(/^[a-zA-Z]+(?:\s[a-zA-Z]+)?$/, {
      message: "Name can only contain letters and a single space between names",
    }),

  username: z
    .string()
    .min(1, "Too short")
    .max(30, "Too long")
    .regex(/^[a-z0-9_]/, "Must start with letter, number, or underscore")
    .regex(
      /^[a-z0-9_.]*$/,
      "Only lowercase, numbers, underscores, dots allowed",
    )
    .regex(/[a-z0-9]$/, "Must end with letter or number"),

  bio: z
    .string()
    .max(100, { message: "Bio must be at most 100 characters long" }),

  dateOfBirth: z
    .date()
    .refine((date) =>
      new AgeChecker(date).isAtLeast(13).isAtMost(100).checkValid(),
    ),

  phoneNumber: z
    .object({
      phoneNumber: z.string(),
      countryCode: z.string(),
    })
    .refine((data) =>
      isValidPhoneNumber(data.phoneNumber, data.countryCode as CountryCode),
    ),

  phoneNumberOTP: z.string().length(6),
};

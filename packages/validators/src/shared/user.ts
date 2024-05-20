import type { CountryCode } from "libphonenumber-js";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

import { AgeChecker } from "@oppfy/utils";

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
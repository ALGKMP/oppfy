import type { CountryCode } from "libphonenumber-js";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

import { AgeChecker } from "@oppfy/utils";

export const fullName = z
  .string()
  .min(2, { message: "Name is too short" })
  .max(24, { message: "Name is too long" })
  .regex(/^[a-zA-Z]+([ '-][a-zA-Z]+)*$/, {
    message: "Name contains invalid characters",
  });

export const username = z
  .string()
  .min(1, { message: "Username is too short" })
  .max(24, { message: "Username is too long" });

export const bio = z.string().max(100, { message: "Bio is too long" });

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

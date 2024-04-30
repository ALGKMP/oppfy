import type { CountryCode } from "libphonenumber-js";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

export const userId = z.string().uuid();
export const profileId = z.string().uuid();
export const fullName = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z]+([ '-][a-zA-Z]+)*$/);
export const username = z.string().min(1);
export const dateOfBirth = z.date();

export const phoneNumberOTPValidation = z.string().length(6);
export const phoneNumber = z
  .object({
    phoneNumber: z.string(),
    countryCode: z.string(),
  })
  .refine((data) =>
    isValidPhoneNumber(data.phoneNumber, data.countryCode as CountryCode),
  );

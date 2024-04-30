import type { CountryCode } from "libphonenumber-js";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

// export const sharedUserSchema = {
//   userId: z.string().uuid(),
//   profileId: z.string().uuid(),
//   fullName: z.string().min(1),
//   username: z.string().min(1),
//   dateOfBirth: z.date(),

//   phoneNumber: z
//     .object({
//       phoneNumber: z.string(),
//       countryCode: z.string(),
//     })
//     .refine((data) =>
//       isValidPhoneNumber(data.phoneNumber, data.countryCode as CountryCode),
//     ),
// };

export const userId = z.string().uuid();
export const profileId = z.string().uuid();
export const fullName = z.string().min(1);
export const username = z.string().min(1);
export const dateOfBirth = z.date();

export const phoneNumber = z
  .object({
    phoneNumber: z.string(),
    countryCode: z.string(),
  })
  .refine((data) =>
    isValidPhoneNumber(data.phoneNumber, data.countryCode as CountryCode),
  );

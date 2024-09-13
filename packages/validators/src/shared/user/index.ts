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

export const PublicFollowState = z.enum(["NotFollowing", "Following"]);
export const PrivateFollowState = z.enum([
  "NotFollowing",
  "OutboundRequest",
  "Following",
  "IncomingRequest",
]);
export const FriendState = z.enum([
  "NotFriends",
  "OutboundRequest",
  "Friends",
  "IncomingRequest",
]);

export const PublicProfileStatus = z.object({
  privacy: z.literal("public"),
  isTargetUserBlocked: z.boolean(),
  isOtherUserBlocked: z.boolean(),
  targetUserFollowState: PublicFollowState,
  targetUserFriendState: FriendState,
  otherUserFollowState: PublicFollowState,
  otherUserFriendState: FriendState,
});

export const PrivateProfileStatus = z.object({
  privacy: z.literal("private"),
  isTargetUserBlocked: z.boolean(),
  isOtherUserBlocked: z.boolean(),
  targetUserFollowState: PrivateFollowState,
  targetUserFriendState: FriendState,
  otherUserFollowState: PrivateFollowState,
  otherUserFriendState: FriendState,
});

export const PrivacyStatus = z.union([
  PublicProfileStatus,
  PrivateProfileStatus,
]);

export const fullProfileSelf = z.object({
  userId: z.string(),
  profileId: z.string(),
  username: z.string(),
  name: z.string(),
  bio: z.union([z.string(), z.null()]),
  privacy: z.enum(["public", "private"]),
  followerCount: z.number(),
  followingCount: z.number(),
  friendCount: z.number(),
  profilePictureUrl: z.string().nullable(),
  profileStats: z.object({
    createdAt: z.date(),
    profileId: z.string(),
    posts: z.number(),
    following: z.number(),
    id: z.string(),
    updatedAt: z.date(),
    followers: z.number(),
    friends: z.number(),
    views: z.number(),
  }),
});

export const fullProfileOther = z.object({
  userId: z.string(),
  profileId: z.number(),
  username: z.string(),
  name: z.string(),
  bio: z.union([z.string(), z.null()]),
  privacy: z.enum(["public", "private"]),
  profilePictureUrl: z.string().nullable(),
  followerCount: z.number(),
  followingCount: z.number(),
  friendCount: z.number(),
  networkStatus: PrivacyStatus,
});

export const friendItems = z.array(
  z.object({
      userId: z.string(),
      profileId: z.number(),
      username: z.string(),
      name: z.string(),
      profilePictureUrl: z.string().nullable(),
      privacy: z.enum(["public", "private"]),
    }),
);

export const friendItemsOther = z.array(
  z.object({
      userId: z.string(),
      profileId: z.number(),
      username: z.string(),
      name: z.string(),
      profilePictureUrl: z.string().nullable(),
      relationshipState: z.enum([
        "following",
        "followRequestSent",
        "notFollowing",
      ]),
      privacy: z.enum(["public", "private"]),
  }),
);

export const recommededProfiles= z.array(
  z.object({
    profilePictureUrl: z.string().nullable(),
    userId: z.string(),
    username: z.string(),
    profileId: z.number(),
    privacy: z.enum(["public", "private"]),
    fullName: z.string().nullable(),
  }),
);

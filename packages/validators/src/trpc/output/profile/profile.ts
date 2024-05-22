import { z } from "zod";

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
  blocked: z.boolean(),
  targetUserFollowState: PublicFollowState,
  targetUserFriendState: FriendState,
  otherUserFollowState: PublicFollowState,
  otherUserFriendState: FriendState,
});

export const PrivateProfileStatus = z.object({
  privacy: z.literal("private"),
  blocked: z.boolean(),
  targetUserFollowState: PrivateFollowState,
  targetUserFriendState: FriendState,
  otherUserFollowState: PrivateFollowState,
  otherUserFriendState: FriendState,
});

export const PrivacyStatus = z.union([PublicProfileStatus, PrivateProfileStatus]);

const trpcProfileOutputSchema = {
  compactProfile: z.object({
    userId: z.string(),
    privacy: z.enum(["public", "private"]),
    username: z.string(),
    name: z.string(),
    profilePictureUrl: z.string(),
  }),

  fullProfileSelf: z.object({
    userId: z.string(),
    privacy: z.enum(["public", "private"]),
    username: z.string(),
    name: z.string(),
    bio: z.union([z.string(), z.null()]),
    followerCount: z.number(),
    followingCount: z.number(),
    friendCount: z.number(),
    profilePictureUrl: z.string(),
  }),

  fullProfileOther: z.object({
    userId: z.string(),
    username: z.string(),
    name: z.string(),
    bio: z.union([z.string(), z.null()]),
    profilePictureUrl: z.string(),
    followerCount: z.number(),
    followingCount: z.number(),
    friendCount: z.number(),
    networkStatus: PrivacyStatus,
  }),
};

export default trpcProfileOutputSchema;

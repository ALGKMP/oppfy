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

const trpcProfileOutputSchema = {
  compactProfile: z.object({
    userId: z.string(),
    profileId: z.number(),
    privacy: z.enum(["public", "private"]),
    username: z.string(),
    fullName: z.string(),
    profilePictureKey: z.string(),
  }),

  fullProfileSelf: z.object({
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
      id: z.number(),
      updatedAt: z.date(),
      followers: z.number(),
      friends: z.number(),
      views: z.number(),
    }),
  }),

  fullProfileOther: z.object({
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
  }),
};

export default trpcProfileOutputSchema;

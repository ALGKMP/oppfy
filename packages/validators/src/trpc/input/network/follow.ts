import { z } from "zod";

const followInputSchema = {
  followUser: z.object({
    userId: z.string(),
  }),

  unfollowUser: z.object({
    userId: z.string(),
  }),

  removeFollower: z.object({
    userId: z.string(),
  }),

  paginateFollowersSelf: z.object({
    cursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
    pageSize: z.number().optional(),
  }),

  paginateFollowersOthers: z.object({
    userId: z.string(),
    cursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
    pageSize: z.number().optional(),
  }),

  paginateFollowingSelf: z.object({
    cursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
    pageSize: z.number().optional(),
  }),

  paginateFollowingOthers: z.object({
    userId: z.string(),
    cursor: z
      .object({
        createdAt: z.date(),
        profileId: z.number(),
      })
      .optional(),
    pageSize: z.number().optional(),
  }),

  isFollowingSelf: z.object({
    userId: z.string(),
  }),
};

export default followInputSchema;

import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const requestRouter = createTRPCRouter({
  countRequests: protectedProcedure.query(async ({ ctx }) => {
    try {
      const followRequestCount = await ctx.services.follow.countFollowRequests(
        ctx.session.uid,
      );
      const friendRequestCount = await ctx.services.friend.countFriendRequests(
        ctx.session.uid,
      );

      return {
        followRequestCount,
        friendRequestCount,
      };
    } catch (err) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: err });
    }
  }),
});

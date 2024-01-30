import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { Date } from "@acme/utils";

import { schema } from "../../../db/src";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(
      z.object({
        firebaseUid: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { firebaseUid } = input;

      try {
        // await ctx.db.user.create({
        //   data: {
        //     id: firebaseUid,
        //   },
        // });
        const exists = await ctx.db
          .select()
          .from(schema.user)
          .where(eq(schema.user.id, firebaseUid));
        if (exists.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User already exists",
          });
        }
        await ctx.db.insert(schema.user).values({ id: firebaseUid });
      } catch (_err) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }
    }),
  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      // return await ctx.db.user.findUniqueOrThrow({
      //   where: { id: ctx.session.uid },
      // });

      await ctx.db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, ctx.session.uid));
      const possibleUsers = await ctx.db.selectDistinct().from(schema.user).where(eq(schema.user.id, ctx.session.uid));

      const user = possibleUsers[0];

      return user;
    } catch (_err) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
  }),
  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // transaction to ensure an atomic operation
      // await ctx.db.$transaction(async (db) => {
      //   await db.user.delete({
      //     where: { id: ctx.session.uid },
      //   });

      //   await ctx.auth.deleteUser(ctx.session.uid);
      // });
      await ctx.db.transaction(async (db) => {
        await db.delete(schema.user).where(eq(schema.user.id, ctx.session.uid));
        await ctx.auth.deleteUser(ctx.session.uid);
      });
    } catch (_err) {
      console.log(_err);
      throw new TRPCError({
        code: "NOT_FOUND",
        // message: "User not found",
        message: "shits broken 1",
      });
    }
  }),
  hasUserDetails: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // const { firstName, dateOfBirth } = await ctx.db.user.findUniqueOrThrow({
      //   where: { id: ctx.session.uid },
      //   select: {
      //     firstName: true,
      //     dateOfBirth: true,
      //   },
      // });
      const result = await ctx.db
        .select({
          name: schema.user.name,
          dateOfBirth: schema.user.dateOfBirth,
        })
        .from(schema.user)
        .where(eq(schema.user.id, ctx.session.uid));

      if (result[0] == undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "failed to find user",
        });
      }
      const { name, dateOfBirth } = result[0];

      return !!name && !!dateOfBirth;
    } catch (_err) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "shits broken 5",
      });
    }
  }),
  updateUserDetails: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        username: z.string().min(1).optional(),
        dateOfBirth: z
          .date()
          .refine((date) =>
            new Date.AgeChecker(date).isAtLeast(13).isAtMost(100).checkValid(),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input: userDetails }) => {
      try {
        // await ctx.db.user.update({
        //   where: { id: ctx.session.uid },
        //   data: {
        //     ...userDetails,
        //   },
        // });

        // TODO: Problem with Drizzle  https://www.answeroverflow.com/m/1144754734423625920

        if (userDetails.dateOfBirth != undefined || userDetails.name != undefined) {
          console.log('updating user details')
          await ctx.db
            .update(schema.user)
            .set({
              ...userDetails,
            })
            .where(eq(schema.user.id, ctx.session.uid));
        }
        if (userDetails.username) {
          console.log('updating profile details')
          await ctx.db.insert(schema.profile).values({
            userName: userDetails.username,
          });
        }
      } catch (_err) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "shits broken 8",
          // message: _err
        });
      }
    }),
});

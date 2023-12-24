import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Date } from "@acme/utils";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  search: protectedProcedure.query(async ({ ctx }) => {}),
});

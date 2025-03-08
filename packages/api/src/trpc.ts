/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import crypto from "crypto";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { cloudfront } from "@oppfy/cloudfront";
import { db } from "@oppfy/db";
import { env } from "@oppfy/env";
import { mux } from "@oppfy/mux";
import { s3 } from "@oppfy/s3";

import { auth } from "./auth";
import { services } from "./services";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

interface CreateContextOptions {
  session: { user: { id: string } } | null;
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    s3,
    db,
    mux,
    cloudfront,
    services,
    session: opts.session,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const source = opts.headers.get("x-trpc-source") ?? "unknown";
  console.log(">>> tRPC Request from", source);

  opts.headers.set("x-request-id", crypto.randomUUID());

  // Get the session from better-auth
  const session = await auth.api.getSession({
    headers: opts.headers,
  });

  return createInnerTRPCContext({
    session,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: ctx.session,
    },
  });
});

export const createCallerFactory = t.createCallerFactory;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authed) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees ctx.session.user is not
 * null
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const userIdSchema = z.object({
  userId: z.string(),
});

const enforceCanAccessUserData = t.middleware(async (opts) => {
  const { ctx, next, getRawInput } = opts;

  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  try {
    const rawInput = await getRawInput();
    console.log("Raw input:", rawInput);

    const result = userIdSchema.safeParse(rawInput);
    if (!result.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "userId is required in input",
      });
    }
    const { userId } = result.data;
    console.log("Parsed userId:", userId);

    const canAccess = await ctx.services.user.canAccessUserData({
      currentUserId: ctx.session.user.id,
      targetUserId: userId,
    });
    console.log("canAccess", canAccess);

    if (!canAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to access this user's data",
      });
    }

    return next({
      ctx: {
        session: ctx.session,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "userId is required in input",
      });
    }
    throw error;
  }
});

// Create a protected procedure that also enforces user data access
export const protectedWithUserAccess = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceCanAccessUserData);

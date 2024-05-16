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
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { DecodedIdToken } from "firebase-admin/auth";
import superjson from "superjson";
import type { OpenApiMeta } from "trpc-openapi";
import { ZodError } from "zod";

import { db } from "@acme/db";
import { mux } from "@acme/mux";
import { s3 } from "@acme/s3";

import { services } from "./services";
import { auth } from "./utils/firebase";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

// type CreateContextOptions = Record<string, never>;
interface CreateContextOptions {
  session: DecodedIdToken | null;
  verifiedMuxSignature: boolean;
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
    auth,
    services,
    session: opts.session,
    isMuxSignatureVerified: opts.verifiedMuxSignature,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async ({
  req,
  res,
}: CreateNextContextOptions) => {
  const requestId = crypto.randomUUID();
  res.setHeader("x-request-id", requestId);
  const token = req.headers.authorization?.split("Bearer ")[1];
  // const muxSignatureHeader = req.headers["mux-signature"] as Record<string, string | string[]> | undefined;
  console.log('Request Headers', req.headers)
  console.log('Request Body', req.body)
  const muxSignatureHeader = req.headers["mux-signature"] as string | undefined;
  const rawBody = req.body as string;

  let session: DecodedIdToken | null = null;
  let verifiedMuxSignature = false;

  if (token) {
    try {
      session = await auth.verifyIdToken(token);
    } catch (_err) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        cause: "Invalid Firebase Token",
      });
    }
  }
  console.log("Mux Signature Header", muxSignatureHeader)
  console.log("Raw Body", rawBody)
  
  if (rawBody && muxSignatureHeader) {
    console.log('Verifying Mux Webhook Signature')
    try {
      // mux.webhooks.verifySignature(rawBody, muxSignatureHeader, process.env.MUX_WEBHOOK_SECRET);
      verifiedMuxSignature = true;
    } catch (error) {
      console.error('Error verifying Mux webhook signature:', error);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        cause: "Invalid Mux Webhook Signature",
      });
    }
  }

  return createInnerTRPCContext({
    session,
    verifiedMuxSignature
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC
  .context<typeof createTRPCContext>()
  .meta<OpenApiMeta>()
  .create({
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

/**
 * S3 Verification
 */

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

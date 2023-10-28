import { authRouter } from "./router/auth";
import { profileRouter } from "./router/profile";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  profilePhoto: profileRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

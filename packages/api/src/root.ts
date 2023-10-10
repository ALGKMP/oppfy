import { authRouter } from "./router/auth";
import { profilePhotoRouter } from "./router/profilePhoto";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  profilePhoto: profilePhotoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

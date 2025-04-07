// Import user routers

// Import content routers
import { postRouter } from "./content/post.router";
import { postInteractionRouter } from "./content/postInteraction.router";
import { blockRouter } from "./social/block.router";
import { followRouter } from "./social/follow.router";
// Import social routers
import { friendRouter } from "./social/friend.router";
import { reportRouter } from "./social/report.router";
import { authRouter } from "./user/auth.router";
import { profileRouter } from "./user/profile.router";
import { userRouter } from "./user/user.router";

// Export all routers
export {
  // User routers
  userRouter,
  authRouter,
  profileRouter,

  // Social routers
  friendRouter,
  followRouter,
  blockRouter,
  reportRouter,

  // Content routers
  postRouter,
  postInteractionRouter,
};

import authSchemas from "./src/trpc/auth";
import postSchemas from "./src/trpc/post";
import profileSchemas from "./src/trpc/profile";
import userSchemas from "./src/trpc/user";

const ZodSchemas = {
    user: userSchemas,
    auth: authSchemas,
    profile: profileSchemas,
    post: postSchemas,
    };

export default ZodSchemas;

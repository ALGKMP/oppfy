import authSchemas from "./src/schemas/auth";
import postSchemas from "./src/schemas/post";
import profileSchemas from "./src/schemas/profile";
import userSchemas from "./src/schemas/user";

const ZodSchemas = {
    user: userSchemas,
    auth: authSchemas,
    profile: profileSchemas,
    post: postSchemas,

    };

export default ZodSchemas;

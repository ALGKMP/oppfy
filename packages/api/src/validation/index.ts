import authSchemas from "./schemas/auth";
import postSchemas from "./schemas/post";
import profileSchemas from "./schemas/profile";
import userSchemas from "./schemas/user";

const ZodSchemas = {
    user: userSchemas,
    auth: authSchemas,
    profile: profileSchemas,
    post: postSchemas,

    };

export default ZodSchemas;

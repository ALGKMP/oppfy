import userSchemas from "./schemas/user";
import authSchemas from "./schemas/auth";
import profileSchemas from "./schemas/profile";
import postSchemas from "./schemas/post";

const ZodSchemas = {
    user: userSchemas,
    auth: authSchemas,
    profile: profileSchemas,
    post: postSchemas
    };

export default ZodSchemas;
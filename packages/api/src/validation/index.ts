import userSchemas from "./schemas/user";
import authSchemas from "./schemas/auth";
import profileSchemas from "./schemas/profile";

const ZodSchemas = {
    user: userSchemas,
    auth: authSchemas,
    profile: profileSchemas,
    };

export default ZodSchemas;
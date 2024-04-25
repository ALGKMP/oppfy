// src/services/Service.ts
import ProfileService from "./profile"
import UserService from "./user"
// Import other services similarly

const Services = {
  user: UserService,
  profile: ProfileService,
};

export default Services;

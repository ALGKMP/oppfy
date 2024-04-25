// src/services/Service.ts
import ProfileService from "./profile"
import UserService from "./user"
import AWSS3Service from "./aws";

const Services = {
  user: UserService,
  profile: ProfileService,
  aws: AWSS3Service,
};

export default Services;

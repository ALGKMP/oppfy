// src/services/Service.ts
import AWSS3Service from "./aws";
import PostService from "./post";
import ProfileService from "./profile";
import UserService from "./user";

const Services = {
  user: UserService,
  profile: ProfileService,
  aws: AWSS3Service,
  post: PostService,
};

export default Services;

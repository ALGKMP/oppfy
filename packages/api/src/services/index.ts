// src/services/Service.ts
import AWSS3Service from "./aws";
import followService from "./follow";
import friendService from "./friend";
import PostService from "./post";
import ProfileService from "./profile";
import UserService from "./user";

const Services = {
  user: UserService,
  profile: ProfileService,
  aws: AWSS3Service,
  post: PostService,
  friend: friendService,
  follow: followService
};

export default Services;

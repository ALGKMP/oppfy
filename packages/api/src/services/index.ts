import { AwsService } from "./aws";
import { PostService } from "./post";
import { ProfileService } from "./profile";
import { UserService } from "./user";

export const services = {
  aws: new AwsService(),
  post: new PostService(),
  profile: new ProfileService(),
  user: new UserService(),
};

import { AwsService } from "./aws";
import { MuxService } from "./mux";
import { PostService } from "./post";
import { ProfileService } from "./profile";
import { SearchService } from "./search";
import { UserService } from "./user";

export const services = {
  aws: new AwsService(),
  mux: new MuxService(),
  post: new PostService(),
  profile: new ProfileService(),
  user: new UserService(),
  search: new SearchService(),
};

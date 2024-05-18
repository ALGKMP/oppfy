import { AwsService } from "./aws/aws";
import { MuxService } from "./mux/mux";
import { PostService } from "./media/post";
import { ProfileService } from "./profile/profile";
import { SearchService } from "./aws/search";
import { UserService } from "./user/user";
import { BlockService } from "./network/block";
import { FollowService } from "./network/follow";
import { FriendService } from "./network/friend";
import { NotificationService } from "./user/notifications";
import { PrivacyService } from "./user/privacy";
import { PaginationService } from "./media/paginate";

export const services = {
  user: new UserService(),
  notifications: new NotificationService(),
  privacy: new PrivacyService(),
  block: new BlockService(),
  follow: new FollowService(),
  friend: new FriendService(),
  profile: new ProfileService(),
  aws: new AwsService(),
  search: new SearchService(),
  mux: new MuxService(),
  post: new PostService(),
  paginate: new PaginationService(),
};

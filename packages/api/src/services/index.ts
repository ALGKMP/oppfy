import { S3Service } from "./aws/s3";
import { SearchService } from "./aws/search";
import { PaginationService } from "./media/paginate";
import { PostService } from "./media/post";
import { MuxService } from "./mux/mux";
import { BlockService } from "./network/block";
import { FollowService } from "./network/follow";
import { FriendService } from "./network/friend";
import { ProfileService } from "./profile/profile";
import { NotificationService } from "./user/notifications";
import { PrivacyService } from "./user/privacy";
import { UserService } from "./user/user";

export const services = {
  user: new UserService(),
  notifications: new NotificationService(),
  privacy: new PrivacyService(),
  block: new BlockService(),
  follow: new FollowService(),
  friend: new FriendService(),
  profile: new ProfileService(),
  s3: new S3Service(),
  search: new SearchService(),
  mux: new MuxService(),
  post: new PostService(),
  paginate: new PaginationService(),
};

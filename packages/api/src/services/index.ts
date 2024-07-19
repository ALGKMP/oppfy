import { CloudFrontService } from "./aws/cloudfront";
import { S3Service } from "./aws/s3";
import { SearchService } from "./aws/search";
import { PaginationService } from "./media/paginate";
import { PostService } from "./media/post";
import { MuxService } from "./mux/mux";
import { BlockService } from "./network/block";
import { FollowService } from "./network/follow";
import { FriendService } from "./network/friend";
import { ReportService } from "./network/report";
import { ProfileService } from "./profile/profile";
import { ContactService } from "./user/contacts";
import { NotificationsService } from "./user/notifications";
import { PrivacyService } from "./user/privacy";
import { UserService } from "./user/user";

export const services = {
  user: new UserService(),
  notifications: new NotificationsService(),
  contact: new ContactService(),
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
  report: new ReportService(),
  cloudfront: new CloudFrontService(),
};

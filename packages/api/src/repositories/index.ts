import PostRepository from "./post";
import postStatsRepository from "./postStats";
import ProfileRepository from "./profile";
import ProfilePhotoRepository from "./profilePhoto";
import UserRepository from "./user";

const Repositories = {
  user: UserRepository,
  profile: ProfileRepository,
  profilePhoto: ProfilePhotoRepository,
  post: PostRepository,
  postStats: postStatsRepository
};

export default Repositories;

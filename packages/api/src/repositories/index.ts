import postRepository from "./post";
import postStatsRepository from "./postStats";
import profileRepository from "./profile";
import profilePhotoRepository from "./profilePhoto";
import userRepository from "./user";

const Repositories = {
  user: userRepository,
  profile: profileRepository,
  profilePhoto: profilePhotoRepository,
  post: postRepository,
  postStats: postStatsRepository
};

export default Repositories;

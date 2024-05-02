import followersRepository from "./follower";
import postRepository from "./post";
import postStatsRepository from "./postStats";
import profileRepository from "./profile";
import profilePhotoRepository from "./profilePhoto";
import userRepository from "./user";

const repositories = {
  user: userRepository,
  profile: profileRepository,
  profilePhoto: profilePhotoRepository,
  post: postRepository,
  postStats: postStatsRepository,
  follower: followersRepository
};

export default repositories;

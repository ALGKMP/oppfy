import followersRepository from "./follower";
import friendsRepository from "./friend";
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
  friend: friendsRepository,
  follower: followersRepository
};

export default repositories;

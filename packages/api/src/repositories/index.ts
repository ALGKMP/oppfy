import PostRepository from "./post";
import ProfileRepository from "./profile";
import ProfilePhotoRepository from "./profilePhoto";
import UserRepository from "./user";

const Repositories = {
  user: UserRepository,
  profile: ProfileRepository,
  profilePhoto: ProfilePhotoRepository,
  post: PostRepository,
};

export default Repositories;

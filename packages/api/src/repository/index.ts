import UserRepository from "./user";
import ProfileRepository from "./profile";
import ProfilePhotoRepository from "./profilePhoto";
import PostRepository from "./post";

const Repositories = {
    user: UserRepository,
    profile: ProfileRepository,
    profilePhoto: ProfilePhotoRepository,
    post: PostRepository,
    };

export default Repositories;
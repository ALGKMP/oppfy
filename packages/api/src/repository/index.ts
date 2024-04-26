import UserRepository from "./user";
import ProfileRepository from "./profile";
import ProfilePhotoRepository from "./profilePhoto";

const Repositories = {
    user: UserRepository,
    profile: ProfileRepository,
    profilePhoto: ProfilePhotoRepository,
    };

export default Repositories;
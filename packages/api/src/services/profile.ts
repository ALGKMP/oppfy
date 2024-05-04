import { DomainError, ErrorCodes } from "../errors";
import { AwsRepository } from "../repositories/aws";
import { FollowerRepository } from "../repositories/follower";
import { FriendsRepository } from "../repositories/friend";
import { PostRepository } from "../repositories/post";
import { ProfileRepository } from "../repositories/profile";
import { ProfilePictureRepository } from "../repositories/profilePicture";
import { UserRepository } from "../repositories/user";

export class ProfileService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private profilePictureRepository = new ProfilePictureRepository();
  private awsRepository = new AwsRepository();
  private postRepository = new PostRepository();
  private followersRepository = new FollowerRepository();
  private friendsRepository = new FriendsRepository();

  async updateFullName(userId: string, fullName: string) {
    const profile = await this.getUserProfile(userId);
    await this.profileRepository.updateFullName(profile.id, fullName);
  }

  async updateDateOfBirth(userId: string, dateOfBirth: Date) {
    const profile = await this.getUserProfile(userId);
    await this.profileRepository.updateDateOfBirth(profile.id, dateOfBirth);
  }

  async updateProfilePicture(userId: string, key: string) {
    const profile = await this.getUserProfile(userId);

    if (profile === undefined) {
      throw new DomainError(ErrorCodes.PROFILE_NOT_FOUND);
    }

    await this.profilePictureRepository.updateProfilePicture(
      profile.profilePictureId,
      key,
    );
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    const profile = await this.userRepository.getProfile(user.profileId);

    if (profile === undefined) {
      throw new DomainError(ErrorCodes.PROFILE_NOT_FOUND);
    }

    return profile;
  }

  async getProfilePicture(userId: string) {
    const bucket = process.env.S3_POST_BUCKET!;
    const key = `profile-pictures/${userId}.jpg`;

    return await this.awsRepository.putObjectPresignedUrl({
      Bucket: bucket,
      Key: key,
    });
  }

  async getProfileDetails(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    const profile = await this.userRepository.getProfile(user.profileId);

    if (profile === undefined) {
      throw new DomainError(ErrorCodes.PROFILE_NOT_FOUND);
    }

    const profilePicture = await this.getProfilePicture(userId);

    const posts = this.postRepository.getAllPosts(userId);

    const followerCount = await this.followersRepository.followerCount(userId);
    const followingCount =
      await this.followersRepository.followingCount(userId);
    const friendCount = await this.friendsRepository.friendsCount(userId);

    return {
      userId: user.id,
      username: user.username,
      fullName: profile.fullName,
      bio: profile.bio,
      profilePicture,
      posts,
      followerCount,
      followingCount,
      friendCount,
    };
  }

  async removeProfilePicture(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    const profile = await this.profileRepository.getProfile(user.profileId);

    if (profile === undefined) {
      throw new DomainError(ErrorCodes.PROFILE_NOT_FOUND);
    }

    const bucket = process.env.S3_POST_BUCKET!;
    const key = `profile-pictures/${userId}.jpg`;
    const deleteObject = await this.awsRepository.deleteObject(bucket, key);

    if (!deleteObject.DeleteMarker) {
      throw new DomainError(ErrorCodes.FAILED_TO_DELETE);
    }

    await this.profilePictureRepository.removeProfilePicture(
      profile.profilePictureId,
    );
  };

  async getUserStats(userId: string) {
    const followerCount = await this.followersRepository.followerCount(userId);
    const followingCount =
      await this.followersRepository.followingCount(userId);
    const friendCount = await this.friendsRepository.friendsCount(userId);

    return { followerCount, followingCount, friendCount };
  };
}

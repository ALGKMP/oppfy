import { sharedValidators } from "@acme/validators";

import { DomainError, ErrorCodes } from "../errors";
import { AwsRepository } from "../repositories/aws";
import { FollowerRepository } from "../repositories/follower";
import { FriendRepository } from "../repositories/friend";
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
  private friendsRepository = new FriendRepository();

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

  async getBasicProfile(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      throw new DomainError(ErrorCodes.PROFILE_NOT_FOUND);
    }

    let profilePictureUrl = null;
    if (profile.profilePictureId) {
      profilePictureUrl = await this.getProfilePicture(userId);
      if (!profilePictureUrl) {
        throw new DomainError(ErrorCodes.PROFILE_PICTURE_NOT_FOUND);
      }
    }

    return sharedValidators.user.basicProfile.parse({
      userId: user.id,
      username: user.username,
      name: profile.fullName,
      profilePictureUrl,
    });
  }

  async getFullProfile(userId: string) {
    // TODO: Fuck this, using joins
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      throw new DomainError(ErrorCodes.PROFILE_NOT_FOUND);
    }

    const followerCount = await this.followersRepository.countFollowers(userId);
    if (!followerCount) {
      throw new DomainError(ErrorCodes.FAILED_TO_COUNT_FOLLOWERS);
    }

    const followingCount =
      await this.followersRepository.countFollowing(userId);
    if (!followingCount) {
      throw new DomainError(ErrorCodes.FAILED_TO_COUNT_FOLLOWING);
    }

    const friendCount = await this.friendsRepository.friendsCount(userId);
    if (!friendCount) {
      throw new DomainError(ErrorCodes.FAILED_TO_COUNT_FRIENDS);
    }

    let profilePictureUrl = null;
    if (profile.profilePictureId) {
      profilePictureUrl = await this.getProfilePicture(userId);
      if (!profilePictureUrl) {
        throw new DomainError(ErrorCodes.PROFILE_PICTURE_NOT_FOUND);
      }
    }

    return sharedValidators.user.fullProfile.parse({
      userId: user.id,
      username: user.username,
      name: profile.fullName,
      bio: profile.bio,
      followerCount,
      followingCount,
      friendCount,
      profilePictureUrl,
    });
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
  }

  async getUserStats(userId: string) {
    const followerCount = await this.followersRepository.countFollowers(userId);
    const followingCount =
      await this.followersRepository.countFollowing(userId);
    const friendCount = await this.friendsRepository.friendsCount(userId);

    return { followerCount, followingCount, friendCount };
  }
}

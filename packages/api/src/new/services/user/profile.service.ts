import { inject, injectable } from "inversify";

import type { Transaction } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  GetProfileByUsernameParams,
  GetProfileOtherParams,
  GetProfileSelfParams,
  GetUploadProfilePictureUrlParams,
  IProfileService,
  ProfileByUsernameResult,
  ProfileResult,
  ProfileSelfResult,
  SearchProfilesByUsernameParams,
  UpdateProfileParams,
} from "../../interfaces/services/user/profileService.interface";
import { BlockRepository } from "../../repositories/social/block.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { UserRepository } from "../../repositories/user/user.repository";

@injectable()
export class ProfileService implements IProfileService {
  private tx: Transaction;
  private userRepository: UserRepository;
  private profileRepository: ProfileRepository;
  private blockRepository: BlockRepository;

  /*     private friendService = new FriendService();
    private followService = new FollowService();
    private blockService = new BlockService(); */

  constructor(
    @inject(TYPES.Transaction) tx: Transaction,
    @inject(TYPES.UserRepository) userRepository: UserRepository,
    @inject(TYPES.ProfileRepository) profileRepository: ProfileRepository,
    @inject(TYPES.BlockRepository) blockRepository: BlockRepository,
  ) {
    this.tx = tx;
    this.userRepository = userRepository;
    this.profileRepository = profileRepository;
    this.blockRepository = blockRepository;
  }

  getUploadProfilePictureUrl(
    params: GetUploadProfilePictureUrlParams,
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }

  updateProfile(params: UpdateProfileParams): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getProfileByUsername(
    params: GetProfileByUsernameParams,
  ): Promise<ProfileByUsernameResult> {
    throw new Error("Method not implemented.");
  }

  getProfileSelf(params: GetProfileSelfParams): Promise<ProfileSelfResult> {
    throw new Error("Method not implemented.");
  }
  getProfile(params: GetProfileOtherParams): Promise<ProfileResult> {
    throw new Error("Method not implemented.");
  }
  searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<ProfileByUsernameResult[]> {
    throw new Error("Method not implemented.");
  }
}

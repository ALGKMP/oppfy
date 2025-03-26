import { Result } from "neverthrow";

import { AwsErrors } from "../../../errors/aws.error";
import { UserErrors } from "../../../errors/user/user.error";

export interface SyncContactsParams {
  userId: string;
  contacts: string[];
}

export type SyncContactsResult = Result<
  void,
  UserErrors.UserNotFound | AwsErrors.SQSFailedToSend
>;

export interface DeleteContactsParams {
  userId: string;
}

export type DeleteContactsResult = Result<
  void,
  UserErrors.UserNotFound | AwsErrors.SQSFailedToSend
>;

export interface FilterPhoneNumbersOnAppParams {
  phoneNumbers: string[];
}

export interface GetRecommendationsIdsParams {
  userId: string;
}

export type GetRecomendationIdsResult = Result<
  {
    tier1: string[];
    tier2: string[];
    tier3: string[];
  },
  UserErrors.UserNotFound
>;

export interface GetRecommendationProfilesSelfParams {
  userId: string;
}

export interface RecommendationProfile {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  relationshipStatus: "notFollowing" | "following" | "requested";
}

export type GetRecommendationProfilesSelfResult = Result<
  RecommendationProfile[],
  UserErrors.UserNotFound
>;

export interface IContactService {
  syncContacts(params: SyncContactsParams): Promise<SyncContactsResult>;

  deleteContacts(params: DeleteContactsParams): Promise<DeleteContactsResult>;

  filterPhoneNumbersOnApp(
    params: FilterPhoneNumbersOnAppParams,
  ): Promise<string[]>;

  getRecommendationsIds(
    params: GetRecommendationsIdsParams,
  ): Promise<GetRecomendationIdsResult>;

  getRecommendationProfilesSelf(
    params: GetRecommendationProfilesSelfParams,
  ): Promise<GetRecommendationProfilesSelfResult>;
}

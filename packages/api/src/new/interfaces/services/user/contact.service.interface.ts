import { Result } from "neverthrow";

import { AwsErrors } from "../../../errors/aws.error";
import { UserErrors } from "../../../errors/user/user.error";
import { HydratedProfile } from "../../../models";

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
export interface GetRecommendationProfilesSelfParams {
  userId: string;
}


export type GetRecommendationProfilesResult = Result<
  HydratedProfile[],
  UserErrors.UserNotFound
>;

export interface IContactService {
  syncContacts(params: SyncContactsParams): Promise<SyncContactsResult>;

  deleteContacts(params: DeleteContactsParams): Promise<DeleteContactsResult>;

  filterPhoneNumbersOnApp(
    params: FilterPhoneNumbersOnAppParams,
  ): Promise<string[]>;

  getProfileRecommendations(
    params: GetRecommendationProfilesSelfParams,
  ): Promise<GetRecommendationProfilesResult>;
}

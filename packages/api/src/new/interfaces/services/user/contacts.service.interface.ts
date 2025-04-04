import { Result } from "neverthrow";

import * as AwsErrors from "../../../errors/aws.error";
import * as UserErrors from "../../../errors/user/user.error";
import { HydratedProfile } from "../../../models";
import { UserIdParam } from "../../types";

export interface UpdateUserContactsParams {
  userId: string;
  hashedPhoneNumbers: string[];
}

export interface FilterPhoneNumbersOnAppParams {
  phoneNumbers: string[];
}



export interface ContactRecommendation {
  userId: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  mutualContactsCount: number;
}


export interface IContactsService {
  updateUserContacts(params: UpdateUserContactsParams): Promise<
    Result<void, UserErrors.UserNotFound | AwsErrors.SQSFailedToSend>
  >;

  filterPhoneNumbersOnApp(
    params: FilterPhoneNumbersOnAppParams,
  ): Promise<string[]>;

  getProfileRecommendations(
    params: UserIdParam,
  ): Promise<Result<HydratedProfile[], UserErrors.UserNotFound>>;
}

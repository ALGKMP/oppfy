import type { Result } from "neverthrow";

import type { HydratedProfile } from "../../../models";
import type { UserIdParam } from "../../types";

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
  updateUserContacts(
    params: UpdateUserContactsParams,
  ): Promise<Result<void, never>>;

  filterPhoneNumbersOnApp(
    params: FilterPhoneNumbersOnAppParams,
  ): Promise<Result<string[], never>>;

  getProfileRecommendations(
    params: UserIdParam,
  ): Promise<Result<HydratedProfile[], never>>;
}

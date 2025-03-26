import type { DatabaseOrTransaction } from "@oppfy/db";

export interface UpdateUserContactsParams {
  userId: string;
  hashedPhoneNumbers: string[];
}

export interface DeleteContactsParams {
  userId: string;
}

export interface GetContactsParams {
  userId: string;
}

export interface GetRecommendationsParams {
  userId: string;
}

export interface ContactRecommendation {
  userId: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  mutualContactsCount: number;
}

export interface IContactsRepository {
  updateUserContacts(
    params: UpdateUserContactsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  deleteContacts(
    params: DeleteContactsParams,
    db?: DatabaseOrTransaction,
  ): Promise<void>;

  getContacts(
    params: GetContactsParams,
    db?: DatabaseOrTransaction,
  ): Promise<string[]>;

  getRecommendations(
    params: GetRecommendationsParams,
    db?: DatabaseOrTransaction,
  ): Promise<ContactRecommendation[]>;
}

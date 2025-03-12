import type { Transaction } from "@oppfy/db";

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
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  mutualContactsCount: number;
}

export interface IContactsRepository {
  updateUserContacts(
    params: UpdateUserContactsParams,
    db?: Transaction,
  ): Promise<void>;

  deleteContacts(params: DeleteContactsParams, db?: Transaction): Promise<void>;

  getContacts(params: GetContactsParams, db?: Transaction): Promise<string[]>;

  getRecommendations(
    params: GetRecommendationsParams,
    db?: Transaction,
  ): Promise<ContactRecommendation[]>;
}

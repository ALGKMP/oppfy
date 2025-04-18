/* eslint-disable no-debugger */
import { CloudFront } from "@oppfy/cloudfront";
import { Mux } from "@oppfy/mux";

import type { Post, Profile } from "../models";

const mux = new Mux();
const cloudfront = new CloudFront();

export type Hydrate<T> = T extends Profile
  ? T & { profilePictureUrl: string | null }
  : T extends Post
    ? T & { assetUrl: string }
    : never;

export const hydrateProfile = <T extends Profile>(
  profile: T,
): T & { profilePictureUrl: string | null } => {
  const profilePictureUrl = profile.profilePictureKey
    ? cloudfront.getProfilePictureUrl(profile.profilePictureKey)
    : null;

  return {
    ...profile,
    profilePictureUrl,
  };
};

export const hydratePost = async <T extends Post>(
  post: T,
): Promise<T & { assetUrl: string }> => {
  const assetUrl =
    post.mediaType === "image"
      ? await cloudfront.getSignedPrivatePostUrl(post.postKey)
      : mux.getStreamUrl(post.postKey);

  return { ...post, assetUrl };
};

export const shouldNeverHappen = (msg?: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    debugger;
  }

  throw new Error(
    `shouldNeverHappen: ${msg ?? "unknown error"} ${JSON.stringify(args)}`,
  );
};

export const invariant: <T>(
  predicate: T,
  msg?: string,
) => asserts predicate is NonNullable<T> = (predicate, msg) => {
  if (predicate) return;
  throw new Error(`Invariant failed: ${msg}`);
};

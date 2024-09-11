import type { UseQueryResult } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export type Profile = RouterOutputs["profile"]["getFullProfileSelf"];
export type RecommendationProfile =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][number];

const useProfile = (): UseQueryResult<Profile, unknown> & {
  profile: Profile | undefined;
} => {
  const query = api.profile.getFullProfileSelf.useQuery(undefined, {
    staleTime: STALE_TIME,
  });

  return {
    ...query,
    profile: query.data,
  };
};

export default useProfile;

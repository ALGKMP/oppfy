import type { UseQueryResult } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export type SelfProfile = RouterOutputs["profile"]["getFullProfileSelf"];
export type OtherProfile = RouterOutputs["profile"]["getFullProfileOther"];

export type RecommendationProfile =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][number];

interface UseProfileProps {
  userId?: string;
}

const useProfile = ({ userId }: UseProfileProps = { userId: undefined }): UseQueryResult<OtherProfile | SelfProfile, unknown> & {
  profile: OtherProfile | SelfProfile | undefined;
} => {
  if (userId) {
    const query = api.profile.getFullProfileOther.useQuery({ userId }, {
      staleTime: STALE_TIME,
    });
    return {
      ...query,
      profile: query.data,
    };
  } else {
    const query = api.profile.getFullProfileSelf.useQuery(undefined, {
      staleTime: STALE_TIME,
    });
    return {
      ...query,
      profile: query.data,
    };
  }
};

export default useProfile;

import type { UseQueryResult } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

export type SelfProfile = RouterOutputs["profile"]["getFullProfileSelf"];
export type OtherProfile = RouterOutputs["profile"]["getFullProfileOther"];

export type RecommendationProfile =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][number];

interface UseProfileProps {
  userId?: string;
}

const useProfile = (
  { userId }: UseProfileProps = { userId: undefined },
): UseQueryResult<OtherProfile | SelfProfile, unknown> & {
  profile: OtherProfile | SelfProfile | undefined;
} => {
  const query = api.profile.getFullProfileOther.useQuery(
    { userId: userId! },
    {
      enabled: !!userId,
    },
  );

  const selfQuery = api.profile.getFullProfileSelf.useQuery(undefined, {
    enabled: !userId,
  });

  if (userId) {
    return {
      ...query,
      profile: query.data,
    };
  }

  return {
    ...selfQuery,
    profile: selfQuery.data,
  };
};

export default useProfile;

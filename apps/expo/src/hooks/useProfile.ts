import { useEffect } from "react";
import type { UseQueryResult } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

export type SelfProfile = RouterOutputs["profile"]["getFullProfileSelf"];
export type OtherProfile = RouterOutputs["profile"]["getFullProfileOther"];
export type NetworkRelationships =
  RouterOutputs["profile"]["getNetworkRelationships"];

export type RecommendationProfile =
  RouterOutputs["contacts"]["getRecommendationProfilesSelf"][number];

interface UseProfileProps {
  userId?: string;
  enabled?: boolean;
}

interface ProfileResult {
  data?: OtherProfile | SelfProfile;
  networkRelationships?: NetworkRelationships;
  isLoading: boolean;
  error: unknown;
}

const useProfile = ({
  userId,
  enabled = true,
}: UseProfileProps = {}): ProfileResult => {
  console.log("[useProfile] Fetching profile:", { userId, enabled });

  const query = api.profile.getFullProfileOther.useQuery(
    { userId: userId! },
    { enabled: !!userId && enabled },
  );

  const selfQuery = api.profile.getFullProfileSelf.useQuery(undefined, {
    enabled: !userId && enabled,
  });

  const networkQuery = api.profile.getNetworkRelationships.useQuery(
    { userId: userId ?? "" },
    { enabled: !!userId && enabled },
  );

  useEffect(() => {
    if (query.data) {
      console.log("[useProfile] Other profile fetched:", {
        userId,
        data: query.data.profileId,
      });
    }
  }, [query.data, userId]);

  useEffect(() => {
    if (selfQuery.data) {
      console.log("[useProfile] Self profile fetched:", {
        data: selfQuery.data.profileId,
      });
    }
  }, [selfQuery.data]);

  if (userId) {
    return {
      data: query.data,
      networkRelationships: networkQuery.data,
      isLoading: query.isLoading || networkQuery.isLoading,
      error: query.error ?? networkQuery.error,
    };
  }

  return {
    data: selfQuery.data,
    isLoading: selfQuery.isLoading,
    error: selfQuery.error,
  };
};

export default useProfile;

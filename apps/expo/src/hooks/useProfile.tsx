import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const STALE_TIME = 20 * 60 * 1000; // 20 minutes

export type Profile = RouterOutputs["profile"]["getFullProfileSelf"];

const useProfile = () => {
  const {
    data: profile,
    isLoading,
    error,
  } = api.profile.getFullProfileSelf.useQuery(undefined, {
    staleTime: STALE_TIME,
  });

  return {
    profile,
    isLoading,
    error,
  };
};

export default useProfile;

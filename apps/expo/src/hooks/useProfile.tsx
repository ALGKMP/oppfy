import { api } from "~/utils/api";

const STALE_TIME = 20 * 60 * 1000; // 20 minutes

export function useProfile() {
  const {
    data: profile,
    isLoading: profileIsLoading,
    error: profileError,
  } = api.profile.getFullProfileSelf.useQuery(undefined, {
    staleTime: STALE_TIME,
  });

  return {
    profile,
    isLoading: profileIsLoading,
    error: profileError,
  };
}

import { useCallback } from "react";
import { useRouter } from "expo-router";

const useLogout = () => {
  const router = useRouter();

  const logout = useCallback(() => {
    router.replace("/auth-welcome");
  }, [router]);

  return logout;
};

export default useLogout;

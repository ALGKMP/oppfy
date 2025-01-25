import { useRouter } from "expo-router";

import { useAuth } from "~/hooks/useAuth";

interface ProfileInfo {
  username: string;
  name: string;
  profilePictureUrl?: string | undefined | null;
}

export interface ProfileRouteParams {
  userId: string;
  profileInfo?: ProfileInfo;
}

const useRouteProfile = () => {
  const { user } = useAuth();
  const router = useRouter();

  const routeProfile = (userId: string, profileInfo?: ProfileInfo) => {
    router.push(
      user?.uid === userId
        ? "/self-profile"
        : {
            pathname: "/[userId]",
            params: profileInfo
              ? {
                  userId,
                  username: profileInfo.username,
                  name: profileInfo.name,
                  profilePictureUrl: profileInfo.profilePictureUrl,
                }
              : { userId },
          },
    );
  };

  return { routeProfile };
};

export default useRouteProfile;

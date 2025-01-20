import { useRouter } from "expo-router";

import { useSession } from "~/contexts/SessionContext";

export type ProfileRouteParams =
  | { userId: string }
  | {
      userId: string;
      username: string;
      name: string;
      profilePictureUrl?: string | undefined | null;
    };

const useRouteProfile = () => {
  const { user } = useSession();
  const router = useRouter();

  const routeProfile = (params: ProfileRouteParams) => {
    router.push(
      user?.uid === params.userId
        ? "/self-profile"
        : {
            pathname: "/[userId]",
            params:
              "name" in params &&
              "username" in params &&
              "profilePictureUrl" in params
                ? {
                    userId: params.userId,
                    username: params.username,
                    name: params.name,
                    profilePictureUrl: params.profilePictureUrl,
                  }
                : { userId: params.userId },
          },
    );
  };

  return { routeProfile };
};

export default useRouteProfile;

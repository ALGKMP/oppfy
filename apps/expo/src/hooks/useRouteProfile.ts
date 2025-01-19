import { useRouter } from "expo-router";

import { useSession } from "~/contexts/SessionContext";

interface ProfileRouteParams {
  userId: string;
  username?: string;
}

const useRouteProfile = () => {
  const { user } = useSession();
  const router = useRouter();

  const routeProfile = ({ userId, username }: ProfileRouteParams) => {
    router.push(
      user?.uid === userId
        ? "/self-profile"
        : {
            pathname: "/[userId]",
            params: { userId, username },
          },
    );
  };

  return { routeProfile };
};

export default useRouteProfile;

import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { api } from "~/utils/api";

export default function ProfilePage() {
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();

  const getProfileIdByUsername =
    api.profile.getProfileIdByUsername.useMutation();

  const getProfileId = api.profile.getProfileId.useMutation();

  useEffect(() => {
    const routeProfile = async () => {
      if (!username) {
        router.navigate("/(profile)/self-profile");
        return;
      }

      let otherProfileId: number;
      let selfProfileId: number;

      try {
        const [otherProfileIdPromise, selfProfileIdPromise] = [
          getProfileIdByUsername.mutateAsync({ username }),
          getProfileId.mutateAsync(),
        ];

        const [otherProfileIdResult, selfProfileIdResult] =
          await Promise.allSettled([
            otherProfileIdPromise,
            selfProfileIdPromise,
          ]);

        if (
          otherProfileIdResult.status === "rejected" ||
          selfProfileIdResult.status === "rejected"
        ) {
          router.navigate("/(profile)/self-profile");
          return;
        }

        otherProfileId = otherProfileIdResult.value;

        selfProfileId = selfProfileIdResult.value;
      } catch (error) {
        router.navigate("/(profile)/self-profile");
        return;
      }

      if (selfProfileId === otherProfileId) {
        router.navigate("/(profile)/self-profile");
      }

      router.navigate(`/(home)/profile/${username}`);
    };

    void routeProfile();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <LoadingIndicatorOverlay />;
}

import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { LoadingIndicatorOverlay } from "~/components/ui";
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
        router.navigate({ pathname: "/(profile)" });
        return;
      }

      let otherProfileId: string;
      let selfProfileId: string;

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
          router.navigate({ pathname: "/(profile)" });
          return;
        }

        otherProfileId = otherProfileIdResult.value;

        selfProfileId = selfProfileIdResult.value;
      } catch (error) {
        router.navigate({ pathname: "/(profile)" });
        return;
      }

      if (selfProfileId === otherProfileId) {
        router.navigate({ pathname: "/(profile)" });
      }

      router.navigate({
        pathname: "/(home)/profile/[userId]",
        params: { userId: username },
      });
    };

    void routeProfile();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <LoadingIndicatorOverlay />;
}

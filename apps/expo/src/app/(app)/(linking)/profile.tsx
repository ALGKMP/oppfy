// app/profile/[username].js
import { useEffect } from "react";
import { Text, View } from "react-native";
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
        console.error("No username provided");
        return;
      }

      let otherProfileId: number;

      try {
        otherProfileId = await getProfileIdByUsername.mutateAsync({
          username,
        });
      } catch (error) {
        console.error("Error getting profile ID:", error);
        return;
      }

      let selfProfileId: number;

      try {
        selfProfileId = await getProfileId.mutateAsync();
      } catch (error) {
        console.error("Error getting self profile ID:", error);
        return;
      }

      if (selfProfileId === otherProfileId) {
        console.log("Same profile");
        router.navigate("/(profile)/self-profile");
      } else {
        console.log("Different profile");
      }
    };

    void routeProfile();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <LoadingIndicatorOverlay />;
}

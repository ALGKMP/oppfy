import { TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MoreHorizontal } from "@tamagui/lucide-icons";
import { Text, View, XStack } from "tamagui";
import { ChevronLeft } from "@tamagui/lucide-icons";

import { BaseScreenView } from "~/components/Views";
import MediaOfYou from "../../(profile)/MediaOfYou";

const Profile = () => {
  const profileId = useLocalSearchParams<{ profileId: string }>().profileId;
  const router = useRouter();

  return (
    <BaseScreenView padding={0} safeAreaEdges={["top"]}>
      <XStack
        paddingVertical="$2"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$background"
      >
        {router.canGoBack() ? (
          <View minWidth="$2" alignItems="flex-start">
            <TouchableOpacity
              onPress={() => {
                void router.back();
              }}
            >
              <ChevronLeft />
            </TouchableOpacity>
          </View>
        ) : (
          <View minWidth="$2" alignItems="flex-start" />
        )}

        <View alignItems="center">
          <Text fontSize="$5" fontWeight="bold">
            Profile
          </Text>
        </View>

        <View minWidth="$2" alignItems="flex-end">
          <TouchableOpacity onPress={() => router.push("/(app)/(settings)")}>
            <MoreHorizontal />
          </TouchableOpacity>
        </View>
      </XStack>
      {profileId && <MediaOfYou profileId={profileId} />}
    </BaseScreenView>
  );
};

export default Profile;

import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, MoreHorizontal } from "@tamagui/lucide-icons";
import { Text, View, XStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import MediaOfYou from "./MediaOfYou";

const SelfProfile = () => {
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
      <MediaOfYou />
    </BaseScreenView>
  );
};

export default SelfProfile;

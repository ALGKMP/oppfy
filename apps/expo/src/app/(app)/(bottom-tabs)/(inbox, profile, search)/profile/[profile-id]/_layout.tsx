import React, {
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import {
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { MoreHorizontal } from "@tamagui/lucide-icons";
import { throttle } from "lodash";
import {
  Avatar,
  Button,
  getToken,
  H2,
  H3,
  H4,
  H5,
  H6,
  ListItemTitle,
  Paragraph,
  SizableText,
  Spacer,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviatedNumber } from "@oppfy/utils";

import CardContainer from "~/components/Containers/CardContainer";
import { Header } from "~/components/Headers";
import { Skeleton } from "~/components/Skeletons";
import StatusRenderer from "~/components/StatusRenderer";
import { BaseScreenView } from "~/components/Views";
import { useUploadProfilePicture } from "~/hooks/media";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import MediaOfYou from "./profile";

type ProfileData = RouterOutputs["profile"]["getFullProfileSelf"];
type FriendItems = RouterOutputs["friend"]["paginateFriendsSelf"]["items"];

const ProfileLayout = () => {
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
        <View minWidth="$2" alignItems="flex-start" />

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

export default ProfileLayout;

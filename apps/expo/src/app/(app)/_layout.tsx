import { Pressable } from "react-native";
import { Redirect, Slot, useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { getTokens } from "@tamagui/core";
import {
  Camera,
  Home,
  Inbox,
  MoreHorizontal,
  Search,
  User2,
} from "@tamagui/lucide-icons";
import { Button, Text, View, XStack } from "tamagui";

import { api } from "~/utils/api";
import { Stack } from "~/layouts";
import { useSession } from "~/contexts/SessionsContext";

const AppLayout = () => {
  const { isLoading: sessionIsLoading, isSignedIn, user } = useSession();
  const { isLoading: getUserIsLoading, data: userData } =
    api.auth.getUser.useQuery();

  if (sessionIsLoading || getUserIsLoading) {
    return <Text>Loading...</Text>;
  }
  
  if (!isSignedIn) {
    return <Redirect href="/auth/phone-number" />;
  }

  if (!userData?.firstName || !userData?.dateOfBirth) {
    return <Redirect href="/welcome" />;
  }

  return <Slot />;
};

export default AppLayout;

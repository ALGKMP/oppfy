import React, { useState } from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Redirect, useRouter } from "expo-router";
import { ChevronRight } from "@tamagui/lucide-icons";
import {
  AlertDialog,
  Button,
  ListItem,
  Separator,
  Text,
  View,
  YGroup,
  YStack,
} from "tamagui";

import { useSession } from "~/contexts/SessionsContext";

const BlockedUsers = () => {
  const { signOut, deleteAccount } = useSession();

  return (
    <View flex={1} backgroundColor="black" paddingHorizontal="$6">
      <Text>Blocked users</Text>
    </View>
  );
};

export default BlockedUsers;

import React from "react";
import { Pressable, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type {
  HeaderBackButtonProps,
  NativeStackHeaderProps,
} from "@react-navigation/native-stack/src/types";
import { ChevronLeft, MoreHorizontal } from "@tamagui/lucide-icons";
import { Text, useTheme } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { Stack } from "~/layouts";
import { api } from "~/utils/api";

const SearchLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerLeft: (props) => <HeaderLeft {...props} />,
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerLeft: () => null,
          title: "Search",
        }}
      />

      <Stack.Screen
        name="profile/[profile-id]"
        options={{
          headerRight: () => (
            <View>
              <Pressable onPress={() => console.log("THING CLICKED")}>
                {({ pressed }) => (
                  <MoreHorizontal style={{ opacity: pressed ? 0.5 : 1 }} />
                )}
              </Pressable>
            </View>
          ),
        }}
      />
      <Stack.Screen name="connections/[user-id]" />
    </Stack>
  );
};

interface HeaderTitleProps {
  children: string;
  tintColor?: string | undefined;
}
type HeaderLeftProps = HeaderBackButtonProps;

type HeaderProps = NativeStackHeaderProps;

const HeaderTitle = ({ children }: HeaderTitleProps) => (
  <Text fontSize="$5" fontWeight="bold">
    {children}
  </Text>
);

const HeaderLeft = ({ canGoBack }: HeaderLeftProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      hitSlop={10}
      onPress={() => {
        canGoBack ? void router.back() : null;
      }}
    >
      <ChevronLeft />
    </TouchableOpacity>
  );
};

const Header = ({ navigation, options }: HeaderProps) => (
  <BaseHeader
    HeaderLeft={
      options.headerLeft
        ? options.headerLeft({
            canGoBack: navigation.canGoBack(),
            tintColor: options.headerTintColor,
          })
        : undefined
    }
    HeaderTitle={
      typeof options.headerTitle === "function" ? (
        options.headerTitle({
          children: options.title ?? "",
          tintColor: options.headerTintColor,
        })
      ) : options.title ? (
        <Text fontSize="$5" fontWeight="bold">
          {options.title}
        </Text>
      ) : null
    }
    HeaderRight={
      options.headerRight
        ? options.headerRight({
            canGoBack: navigation.canGoBack(),
            tintColor: options.headerTintColor,
          })
        : undefined
    }
  />
);

export default SearchLayout;

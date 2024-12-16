import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import type {
  NativeStackHeaderLeftProps,
  NativeStackHeaderProps,
} from "@react-navigation/native-stack/";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Text } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { Stack } from "~/layouts";

const SettingsLayout = () => {
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
          title: "Settings",
        }}
      />

      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />

      <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
      <Stack.Screen name="blocked-users" options={{ title: "Blocked Users" }} />

      <Stack.Screen name="other" options={{ title: "Other" }} />
    </Stack>
  );
};

type HeaderLeftProps = NativeStackHeaderLeftProps;

type HeaderProps = NativeStackHeaderProps;

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

export default SettingsLayout;

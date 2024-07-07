import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type {
  HeaderBackButtonProps,
  NativeStackHeaderProps,
} from "@react-navigation/native-stack/src/types";
import { ChevronLeft, QrCode, X } from "@tamagui/lucide-icons";
import { Text } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { Stack } from "~/layouts";

const ShareProfileLayout = () => {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Share Profile",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.navigate("/profile-actions")}
            >
              <X />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                router.navigate("/share-profile/scan-qr");
              }}
            >
              <QrCode />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="scan-qr"
        options={{
          title: "Scan QR",
          animation: "fade",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

type HeaderProps = NativeStackHeaderProps;

const Header = ({ navigation, options }: HeaderProps) => (
  <BaseHeader
    containerProps={{
      backgroundColor: options.headerTransparent ? "transparent" : undefined,
    }}
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

export default ShareProfileLayout;

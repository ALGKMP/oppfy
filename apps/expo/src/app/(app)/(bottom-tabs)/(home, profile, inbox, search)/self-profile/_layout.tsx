import React from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import type {
  HeaderBackButtonProps,
  NativeStackHeaderProps,
} from "@react-navigation/native-stack/src/types";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Text, useTheme } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { Stack } from "~/layouts";

const SearchLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        header: () => null,
        contentStyle: { backgroundColor: theme.background.val },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          header: (props) => <Header {...props} />,
        }}
      />
      <Stack.Screen
        name="connections"
        options={{
          header: (props) => <Header {...props} />,
          headerLeft: (props) => <HeaderLeft {...props} />,
        }}
      />
    </Stack>
  );
};

type HeaderLeftProps = HeaderBackButtonProps;

type HeaderProps = NativeStackHeaderProps;

const HeaderLeft = ({ canGoBack }: HeaderLeftProps) => {
  const router = useRouter();
  const firstRoute = !router.canDismiss();

  if (firstRoute) return null;

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

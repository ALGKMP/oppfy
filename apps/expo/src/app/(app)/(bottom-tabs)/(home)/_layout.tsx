import type { NativeStackHeaderProps } from "@react-navigation/native-stack/src/types";
import { Text, useTheme } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { Stack } from "~/layouts";

const HomeLayout = () => {
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
          header: () => null,
        }}
      />
      <Stack.Screen name="post/[postId]" options={{ header: () => null }} />
    </Stack>
  );
};

type HeaderProps = NativeStackHeaderProps;

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

export default HomeLayout;

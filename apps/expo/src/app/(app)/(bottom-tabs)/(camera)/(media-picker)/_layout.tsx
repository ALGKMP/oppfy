import React from "react";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack/";
import { Text } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { Icon } from "~/components/ui";
import { Stack } from "~/layouts";

const MediaPickerLayout = () => (
  <Stack
    screenOptions={{
      header: (props) => <Header {...props} />,
    }}
  >
    <Stack.Screen
      name="album-picker"
      options={{
        title: "Albums",
      }}
    />
    <Stack.Screen name="media-picker" />
  </Stack>
);

type HeaderProps = NativeStackHeaderProps;

const Header = ({ navigation, options, back }: HeaderProps) => (
  <BaseHeader
    safeArea={false}
    containerProps={{
      backgroundColor: options.headerTransparent ? "transparent" : undefined,
    }}
    HeaderLeft={
      options.headerLeft?.({
        canGoBack: !!back,
        tintColor: options.headerTintColor,
      }) ?? <DefaultHeaderLeft navigation={navigation} canGoBack={!!back} />
    }
    HeaderTitle={
      typeof options.headerTitle === "function" ? (
        options.headerTitle({
          children: options.title ?? "",
          tintColor: options.headerTintColor,
        })
      ) : (
        <Text fontSize="$5" fontWeight="bold">
          {options.title ?? ""}
        </Text>
      )
    }
    HeaderRight={options.headerRight?.({
      canGoBack: !!back,
      tintColor: options.headerTintColor,
    })}
  />
);

const DefaultHeaderLeft = ({
  navigation,
  canGoBack,
}: {
  navigation: NativeStackHeaderProps["navigation"];
  canGoBack: boolean;
}) => {
  if (!canGoBack) return null;

  return (
    <Icon name="chevron-back" onPress={() => navigation.goBack()} blurred />
  );
};

export default MediaPickerLayout;

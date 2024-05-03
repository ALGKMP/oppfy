import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type {
  HeaderBackButtonProps,
  HeaderButtonProps,
  NativeStackHeaderProps,
} from "@react-navigation/native-stack/src/types";
import { ChevronLeft, Info, X } from "@tamagui/lucide-icons";
import { AlertDialog, Button, Text, useTheme, XStack, YStack } from "tamagui";

import { Header as BaseHeader } from "~/components/Headers";
import { useSession } from "~/contexts/SessionContext";
import { Stack } from "~/layouts";

const OnboardingLayout = () => {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background.val,
      }}
    >
      <Stack
        screenOptions={{
          headerTitle: (props) => <HeaderTitle {...props} />,
          headerLeft: (props) => <HeaderLeft {...props} />,
          headerRight: (props) => <HeaderRight {...props} />,
          header: (props) => <Header {...props} />,
        }}
      >
        <Stack.Screen
          name="index"
          options={{ animation: "fade", header: () => null }}
        />

        <Stack.Screen name="misc/permissions" options={{ animation: "fade" }} />

        <Stack.Screen
          name="auth/phone-number"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="auth/phone-number-otp"
          options={{ animation: "fade" }}
        />

        <Stack.Screen
          name="user-info/welcome"
          options={{
            animation: "fade",
            headerLeft: (props) => <WelcomeHeaderLeft {...props} />,
          }}
        />
        <Stack.Screen
          name="user-info/full-name"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="user-info/date-of-birth"
          options={{ animation: "fade" }}
        />

        <Stack.Screen
          name="user-info/username"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="user-info/profile-picture"
          options={{ animation: "fade" }}
        />
      </Stack>
      <StatusBar />
    </SafeAreaView>
  );
};

interface HeaderTitleProps {
  children: string;
  tintColor?: string | undefined;
}

type HeaderLeftProps = HeaderBackButtonProps;
type HeaderRightProps = HeaderButtonProps;
type HeaderProps = NativeStackHeaderProps;

const HeaderTitle = (_: HeaderTitleProps) => (
  <Text fontFamily="$modak" fontSize="$9">
    OPPFY
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

const HeaderRight = (_: HeaderRightProps) => (
  <TouchableOpacity
    hitSlop={10}
    onPress={() => {
      void Linking.openURL("https://www.oppfy.com");
    }}
  >
    <Info />
  </TouchableOpacity>
);

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
        <Text>{options.title}</Text>
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

const WelcomeHeaderLeft = (_: HeaderLeftProps) => {
  const router = useRouter();
  const { signOut } = useSession();

  const onSubmit = async () => {
    await signOut();
    router.replace("/(onboarding)");
  };

  return (
    <AlertDialog native>
      <AlertDialog.Trigger asChild>
        <TouchableOpacity hitSlop={10}>
          <X />
        </TouchableOpacity>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <AlertDialog.Content
          width="75%"
          bordered
          elevate
          key="content"
          animation={[
            "quick",
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          scale={1}
          opacity={1}
          y={0}
        >
          <YStack alignItems="center" gap="$3">
            <AlertDialog.Title>Exit Onboarding</AlertDialog.Title>
            <AlertDialog.Description textAlign="center">
              Are you sure you want to quit? You&apos;ll lose any changes
              you&apos;ve made.
            </AlertDialog.Description>

            <XStack justifyContent="flex-end" gap="$3">
              <AlertDialog.Cancel asChild>
                <Button size="$4" flex={1}>
                  Stay
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action onPress={onSubmit} asChild>
                <Button flex={1} theme="active">
                  Leave
                </Button>
              </AlertDialog.Action>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
};

export default OnboardingLayout;

import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import type {
  HeaderBackButtonProps,
  HeaderButtonProps,
  NativeStackHeaderProps,
} from "@react-navigation/native-stack/src/types";
import { ChevronLeft, Info, X } from "@tamagui/lucide-icons";
import { Text, useTheme } from "tamagui";

import { AlertDialog } from "~/components/Dialogs";
import { Header as BaseHeader } from "~/components/Headers";
import { useSession } from "~/contexts/SessionContext";
import { Stack } from "~/layouts";

const OnboardingLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTitle: (props) => <HeaderTitle {...props} />,
        headerLeft: (props) => <HeaderLeft {...props} />,
        headerRight: (props) => <HeaderRight {...props} />,
        header: (props) => <Header {...props} />,
        contentStyle: {
          backgroundColor: "#F214FF",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ animation: "fade", header: () => null }}
      />

      <Stack.Screen name="misc/permissions" options={{ animation: "fade" }} />

      <Stack.Screen name="auth/phone-number" options={{ animation: "fade" }} />
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

      <Stack.Screen name="user-info/username" options={{ animation: "fade" }} />
      <Stack.Screen
        name="user-info/profile-picture"
        options={{ animation: "fade" }}
      />
    </Stack>
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

  if (!canGoBack) return null;

  return (
    <TouchableOpacity hitSlop={10} onPress={() => router.back()}>
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

const WelcomeHeaderLeft = (_: HeaderLeftProps) => {
  const router = useRouter();
  const { signOut } = useSession();

  const onSubmit = async () => {
    await signOut();
    router.replace("/(onboarding)");
  };

  return (
    <AlertDialog
      title="Exit Onboarding"
      subtitle="Are you sure you want to quit? You'll lose any changes you've made."
      trigger={
        <TouchableOpacity hitSlop={10}>
          <X />
        </TouchableOpacity>
      }
      onAccept={onSubmit}
    />
  );
};

export default OnboardingLayout;

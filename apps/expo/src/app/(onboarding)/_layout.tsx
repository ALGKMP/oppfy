import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Splash from "@assets/splash.png";
import type {
  NativeStackHeaderLeftProps,
  NativeStackHeaderProps,
  NativeStackHeaderRightProps,
} from "@react-navigation/native-stack/";
import { ChevronLeft, Info, X } from "@tamagui/lucide-icons";
import { Text } from "tamagui";

import { AlertDialog } from "~/components/Dialogs";
import { Header as BaseHeader } from "~/components/Headers";
import { useSession } from "~/contexts/SessionContext";
import { Stack } from "~/layouts";

const OnboardingLayout = () => (
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
      options={{
        animation: "fade",
        header: () => null,
      }}
    />

    <Stack.Screen name="misc/permissions" options={{ animation: "fade" }} />

    <Stack.Screen name="firebaseauth/link" options={{ animation: "fade" }} />
    <Stack.Screen
      name="firebaseauth/phone-number-otp"
      options={{ animation: "fade" }}
    />

    <Stack.Screen
      name="user-info/welcome"
      options={{
        animation: "fade",
        gestureEnabled: false,
        headerLeft: (props) => <WelcomeHeaderLeft {...props} />,
      }}
    />
    <Stack.Screen name="user-info/name" options={{ animation: "fade" }} />
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

const WelcomeHeaderLeft = (_: HeaderLeftProps) => {
  const { signOut } = useSession();

  const onSubmit = async () => {
    await signOut();
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

interface HeaderTitleProps {
  children: string;
  tintColor?: string | undefined;
}

type HeaderLeftProps = NativeStackHeaderLeftProps;
type HeaderRightProps = NativeStackHeaderRightProps;

type HeaderProps = NativeStackHeaderProps;

const HeaderTitle = (_: HeaderTitleProps) => (
  <Image
    source={Splash}
    contentFit="contain"
    style={{ width: 110, height: 110 }}
  />
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
      void Linking.openURL("https://www.oppfy.app");
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

export default OnboardingLayout;

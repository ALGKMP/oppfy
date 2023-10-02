import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { getTokens } from "@tamagui/core";
import {
  Camera,
  Home,
  Inbox,
  MoreHorizontal,
  Search,
  User2,
} from "@tamagui/lucide-icons";
import { Button, Text, View, XStack } from "tamagui";

import { BottomTabs } from "~/layouts";

const BottomTabsLayout = () => {
  const router = useRouter();

  return (
    <View flex={1} backgroundColor="$gray1">
      <BottomTabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: getTokens().color.gray1Dark.val,
            borderTopColor: getTokens().color.gray2Dark.val,
            height: 60,
            paddingTop: 10,
            paddingBottom: 10,
            borderTopWidth: 1,
          },
          tabBarShowLabel: false,
          headerTitle: "",
          headerStyle: {
            backgroundColor: getTokens().color.gray1Dark.val,
            shadowColor: "transparent",
          },
        }}
      >
        <BottomTabs.Screen
          name="(top-tabs)"
          options={{
            tabBarIcon: () => <Home />,
          }}
        />

        <BottomTabs.Screen
          name="search"
          options={{
            tabBarIcon: () => <Search />,
          }}
        />

        <BottomTabs.Screen
          name="camera"
          options={{
            tabBarIcon: () => <Camera />,
          }}
        />

        <BottomTabs.Screen
          name="inbox"
          options={{
            tabBarIcon: () => <Inbox />,
          }}
        />

        <BottomTabs.Screen
          name="profile"
          // options={{
          //   tabBarIcon: () => <User2 />,
          //   headerRight: () => (
          //     <View marginRight="$4">
          //       <Pressable onPress={() => router.push("/profile/settings")}>
          //         {({ pressed }) => (
          //           <MoreHorizontal
          //             size="$1"
          //             style={{ opacity: pressed ? 0.5 : 1 }}
          //           />
          //         )}
          //       </Pressable>
          //     </View>
          //   ),
          // }}
          options={{
            tabBarIcon: () => <User2 />,
            headerShown: false,
          }}
        />
      </BottomTabs>
    </View>
  );
};

export default BottomTabsLayout;

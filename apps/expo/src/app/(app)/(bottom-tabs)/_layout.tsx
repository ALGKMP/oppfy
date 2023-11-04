import { Pressable } from "react-native";
import { Redirect, useRouter } from "expo-router";
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

import { api } from "~/utils/api";
import { BottomTabs } from "~/layouts";

const BottomTabsLayout = () => {
  const { isLoading, data: user } = api.auth.getUser.useQuery();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!user?.firstName || !user?.dateOfBirth) {
    return <Redirect href="welcome" />;
  }

  return (
    <View flex={1} backgroundColor="black">
      <BottomTabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: "black",
            borderTopColor: getTokens().color.gray2Dark.val,
            height: 60,
            paddingTop: 10,
            paddingBottom: 10,
            borderTopWidth: 1,
          },
          tabBarShowLabel: false,
          headerTitle: "",
          headerStyle: {
            backgroundColor: "black",
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

import { Camera, Home, Inbox, Search, User2 } from "@tamagui/lucide-icons";
import { View } from "tamagui";

import { BottomTabs } from "~/layouts";

const BottomTabsLayout = () => {
  return (
    <View flex={1} backgroundColor="$background">
      <BottomTabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "$background",
            borderTopColor: "grey",
            height: 60,
            paddingTop: 10,
            paddingBottom: 10,
            borderTopWidth: 1,
          },
          tabBarShowLabel: false,
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
          options={{
            tabBarIcon: () => <User2 />,
          }}
        />
      </BottomTabs>
    </View>
  );
};
export default BottomTabsLayout;

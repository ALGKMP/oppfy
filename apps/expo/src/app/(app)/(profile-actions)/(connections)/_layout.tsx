import { Camera, Grid3x3 } from "@tamagui/lucide-icons";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const ConnectionsLayout = () => {
  return (
    <TopTabs
      tabBar={(props) => <TopTabBar {...props} />}
      backBehavior="initialRoute"
    >
      <TopTabs.Screen
        name="friends-list"
        options={{
          tabBarLabel: "Friends",
        }}
      />
      <TopTabs.Screen
        name="followers-list"
        options={{
          title: "Test",
          tabBarLabel: "Followers",
        }}
      />
      <TopTabs.Screen
        name="following-list"
        options={{
          title: "Test",
          tabBarLabel: "Following",
        }}
      />
    </TopTabs>
  );
};

export default ConnectionsLayout;

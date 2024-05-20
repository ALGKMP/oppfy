import { Camera, Grid3x3 } from "@tamagui/lucide-icons";
import { useTheme } from "tamagui";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const ConnectionsLayout = () => {
  const theme = useTheme();

  return (
    <TopTabs
      tabBar={(props) => <TopTabBar {...props} />}
      backBehavior="none"
      style={{
        backgroundColor: theme.background.val,
      }}
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

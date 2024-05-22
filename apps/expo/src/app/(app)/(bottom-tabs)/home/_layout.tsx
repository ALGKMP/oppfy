import { useTheme, View } from "tamagui";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const TopTabsLayout = () => {
  const theme = useTheme();

  return (
    <TopTabs
      tabBar={(props) => <TopTabBar {...props} />}
      screenOptions={{
        tabBarContentContainerStyle: {
          backgroundColor: theme.background.val,
        },
      }}
      initialRouteName="for-you-page"
    >
      <TopTabs.Screen name="following" />
      <TopTabs.Screen name="for-you-page" />
    </TopTabs>
  );
};

export default TopTabsLayout;

import { useTheme, View } from "tamagui";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const TopTabsLayout = () => {
  const theme = useTheme();

  return (
    <TopTabs
      tabBar={(props) => <TopTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background.val,
        },
      }}
    >
      <TopTabs.Screen name="following" />
      <TopTabs.Screen name="for-you-page" />
    </TopTabs>
  );
};

export default TopTabsLayout;

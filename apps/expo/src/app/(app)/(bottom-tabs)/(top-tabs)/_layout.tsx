import { View } from "tamagui";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const TopTabsLayout = () => {
  return (
    <TopTabs tabBar={(props) => <TopTabBar {...props} />} screenOptions={{}}>
      <TopTabs.Screen name="following" />
      <TopTabs.Screen name="for-you-page" />
    </TopTabs>
  );
};

export default TopTabsLayout;

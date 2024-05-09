import { View } from "tamagui";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const TopTabsLayout = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "$background",
      }}
    >
      <TopTabs tabBar={(props) => <TopTabBar {...props} />}>
        <TopTabs.Screen name="following" />
        <TopTabs.Screen name="for-you-page" />
      </TopTabs>
    </View>
  );
};

export default TopTabsLayout;

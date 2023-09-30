import { View } from "tamagui";

import { TopTabs } from "~/layouts";

const TopTabsLayout = () => {
  return (
    <View flex={1} backgroundColor="$background">
      <TopTabs>
        <TopTabs.Screen name="following" />
        <TopTabs.Screen name="for-you-page" />
      </TopTabs>
    </View>
  );
};

export default TopTabsLayout;

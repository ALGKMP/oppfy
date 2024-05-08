import { View } from "tamagui";

import { TopTabs } from "~/layouts";

const TopTabsLayout = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "$background",
      }}
    >
      <TopTabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: "black",
            borderTopColor: "transparent",
            elevation: 0,
          },
          tabBarLabelStyle: {
            color: "white",
            fontWeight: "bold",
          },
          tabBarIndicatorStyle: {
            backgroundColor: "white",
            height: 2,
          },
        }}
      >
        <TopTabs.Screen name="following" />
        <TopTabs.Screen name="for-you-page" />
      </TopTabs>
    </View>
  );
};

export default TopTabsLayout;

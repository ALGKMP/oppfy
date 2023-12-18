import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "tamagui";

import { TopTabs } from "~/layouts";

const TopTabsLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
        // Paddings to handle safe area
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
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

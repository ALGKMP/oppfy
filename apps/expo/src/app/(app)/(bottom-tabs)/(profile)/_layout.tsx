import { useTheme, View } from "tamagui";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const ProfileLayout = () => {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "$background",
      }}
    >
      <TopTabs tabBar={(props) => <TopTabBar {...props} />}>
        <TopTabs.Screen name="media-of-you" />
        <TopTabs.Screen name="media-of-friends-you-posted" />
      </TopTabs>
    </View>
  );
};

export default ProfileLayout;

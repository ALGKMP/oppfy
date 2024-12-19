import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";
import { useTheme } from "tamagui";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";
import { api } from "~/utils/api";

const ConnectionsLayout = () => {
  const theme = useTheme();
  const navigation = useNavigation();

  const utils = api.useUtils();
  const profileData = utils.profile.getFullProfileSelf.getData();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData?.username,
    });
  }, [navigation, profileData?.username]);

  return (
    <TopTabs
      tabBar={(props) => <TopTabBar {...props} />}
      backBehavior="none"
      sceneContainerStyle={{
        backgroundColor: theme.background.val,
      }}
    >
      <TopTabs.Screen
        name="friends"
        options={{
          tabBarLabel: "Friends",
        }}
      />
      <TopTabs.Screen
        name="followers"
        options={{
          title: "Test",
          tabBarLabel: "Followers",
        }}
      />
      <TopTabs.Screen
        name="following"
        options={{
          title: "Test",
          tabBarLabel: "Following",
        }}
      />
    </TopTabs>
  );
};

export default ConnectionsLayout;

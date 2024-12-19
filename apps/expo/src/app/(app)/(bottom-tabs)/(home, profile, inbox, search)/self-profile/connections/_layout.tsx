import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";
import { api } from "~/utils/api";

const ConnectionsLayout = () => {
  const navigation = useNavigation();

  const utils = api.useUtils();
  const profileData = utils.profile.getFullProfileSelf.getData();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData?.username,
    });
  }, [navigation, profileData?.username]);

  return (
    <TopTabs backBehavior="none" tabBar={(props) => <TopTabBar {...props} />}>
      <TopTabs.Screen
        name="friends"
        options={{
          title: "Friends",
        }}
      />
      <TopTabs.Screen
        name="followers"
        options={{
          title: "Followers",
        }}
      />
      <TopTabs.Screen
        name="following"
        options={{
          title: "Following",
        }}
      />
    </TopTabs>
  );
};

export default ConnectionsLayout;

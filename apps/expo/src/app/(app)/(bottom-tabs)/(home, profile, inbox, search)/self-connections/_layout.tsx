import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";

import { TopTabs } from "~/components/Layouts/Navigation";
import { api } from "~/utils/api";

const ConnectionsLayout = () => {
  const navigation = useNavigation();

  const utils = api.useUtils();
  const profileData = utils.profile.getFullProfileSelf.getData();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: profileData?.username,
    });
  }, [navigation, profileData?.username]);

  return (
    <TopTabs>
      <TopTabs.Screen
        name="following"
        options={{
          title: "Following",
        }}
      />
      <TopTabs.Screen
        name="followers"
        options={{
          title: "Followers",
        }}
      />
      <TopTabs.Screen
        name="friends"
        options={{
          title: "Friends",
        }}
      />
    </TopTabs>
  );
};

export default ConnectionsLayout;

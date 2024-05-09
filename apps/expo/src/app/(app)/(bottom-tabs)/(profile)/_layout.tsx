import { useEffect } from "react";
import { Camera, Grid3x3 } from "@tamagui/lucide-icons";
import { View } from "tamagui";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";
import { api } from "~/utils/api";

const ProfileLayout = () => {
  const basicProfile = api.profile.getBasicProfile.useQuery({
    userId: "OZK0Mq45uIY75FaZdI2OdUkg5Cx1",
  });

  useEffect(() => {
    console.log(basicProfile.data);
  }, [basicProfile]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "$background",
      }}
    >
      <TopTabs tabBar={(props) => <TopTabBar {...props} />}>
        <TopTabs.Screen
          name="media-of-you"
          options={{
            tabBarLabel: () => <Grid3x3 />,
          }}
        />
        <TopTabs.Screen
          name="media-of-friends-you-posted"
          options={{
            tabBarLabel: () => <Camera />,
          }}
        />
      </TopTabs>
    </View>
  );
};

export default ProfileLayout;

import { useEffect } from "react";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Grid3x3, MoreHorizontal } from "@tamagui/lucide-icons";
import { Avatar, View, YStack } from "tamagui";

import { Header } from "~/components/Headers";
import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";
import { api } from "~/utils/api";

const ProfileLayout = () => {
  const router = useRouter();

  const { data: profileData } = api.profile.getBasicProfile.useQuery({
    userId: "OZK0Mq45uIY75FaZdI2OdUkg5Cx1",
  });

  useEffect(() => {
    console.log(profileData);
  }, [profileData]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "$background",
      }}
    >
      <TopTabs
        tabBar={(props) => (
          <YStack>
            <Header
              title={profileData?.username}
              HeaderRight={
                <Pressable onPress={() => router.push("/(app)/(settings)")}>
                  {({ pressed }) => (
                    <MoreHorizontal
                      size="$1"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              }
            />

            <YStack
              padding="$4"
              alignItems="center"
              backgroundColor="$background"
            >
              <Avatar circular size="$10">
                <Avatar.Image
                  accessibilityLabel="Cam"
                  src={profileData?.profilePictureUrl}
                />
                <Avatar.Fallback backgroundColor="$blue10" />
              </Avatar>
            </YStack>

            <TopTabBar {...props} />
          </YStack>
        )}
      >
        <TopTabs.Screen
          name="media-of-you"
          options={{
            tabBarLabel: () => <Grid3x3 />,
          }}
        />
        <TopTabs.Screen
          name="media-of-friends-you-posted"
          options={{
            title: "Test",
            tabBarLabel: () => <Camera />,
          }}
        />
      </TopTabs>
    </View>
  );
};

export default ProfileLayout;

import React from "react";
import type { ElementType } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
import { MotiView } from "moti";

import { BottomTabs } from "~/components/Layouts/Navigation";
import { Avatar, Icon, Text, View } from "~/components/ui";
import type { IconName } from "~/components/ui";
import { api } from "~/utils/api";

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const BottomTabsLayout = () => {
  const utils = api.useUtils();
  const { data: profileData } = api.profile.getFullProfileSelf.useQuery();

  const { data: unreadNotificationsCount } =
    api.notifications.getUnreadNotificationsCount.useQuery();

  const getTabBarIcon =
    (iconName: IconName) =>
    ({ focused, color, size }: TabBarIconProps) => {
      const animatedStyle = useAnimatedStyle(() => ({
        transform: [
          {
            scale: withSpring(focused ? 1.1 : 1, {
              mass: 0.5,
              damping: 12,
              stiffness: 100,
            }),
          },
        ],
      }));

      return (
        <Animated.View style={animatedStyle}>
          <Icon
            name={iconName}
            color={color}
            size={size}
            iconStyle={{
              opacity: focused ? 1 : 0.5,
            }}
            disabled
          />
        </Animated.View>
      );
    };

  const NotificationBadge = ({ count }: { count: number }) => {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          opacity: {
            type: "timing",
            duration: 300,
          },
          scale: {
            type: "timing",
            duration: 300,
          },
        }}
        style={{
          position: "absolute",
          top: -6,
          left: 12,
          minWidth: 18,
          height: 18,
          paddingHorizontal: 4,
          borderRadius: 9,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          transform: [{ translateX: 0 }],
        }}
      >
        <BlurView
          intensity={100}
          tint="dark"
          style={{ ...StyleSheet.absoluteFillObject }}
        />
        <View
          backgroundColor="$red11"
          opacity={0.8}
          style={{
            ...StyleSheet.absoluteFillObject,
          }}
        />
        <Text color="white" fontSize={10} fontWeight="bold" textAlign="center">
          {count > 99 ? "99+" : count}
        </Text>
      </MotiView>
    );
  };

  return (
    <BottomTabs
      initialRouteName="(home)"
      backBehavior="history"
      screenOptions={{ headerShown: false }}
    >
      <BottomTabs.Screen
        name="(home)"
        options={{
          tabBarIcon: getTabBarIcon("home"),
        }}
      />

      <BottomTabs.Screen
        name="(search)"
        options={{
          tabBarIcon: getTabBarIcon("search"),
        }}
      />

      <BottomTabs.Screen
        name="(camera)"
        options={{
          tabBarIcon: getTabBarIcon("camera"),
        }}
      />

      <BottomTabs.Screen
        name="(inbox)"
        options={{
          tabBarIcon: (props) => (
            <View>
              {getTabBarIcon("notifications")(props)}
              {(unreadNotificationsCount ?? 0) > 0 && (
                <NotificationBadge count={unreadNotificationsCount ?? 0} />
              )}
            </View>
          ),
        }}
      />

      <BottomTabs.Screen
        name="(profile)"
        options={{
          tabBarIcon: ({ focused, size }) => {
            const animatedStyle = useAnimatedStyle(() => ({
              transform: [
                {
                  scale: withSpring(focused ? 1.1 : 1, {
                    mass: 0.5,
                    damping: 12,
                    stiffness: 100,
                  }),
                },
              ],
            }));

            return (
              <Animated.View style={animatedStyle}>
                <Avatar
                  source={
                    profileData?.profilePictureUrl ?? DefaultProfilePicture
                  }
                  size={size}
                  bordered={focused}
                  style={{ opacity: focused ? 1 : 0.5 }}
                />
              </Animated.View>
            );
          },
        }}
      />
    </BottomTabs>
  );
};

export default BottomTabsLayout;

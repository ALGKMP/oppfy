import React from "react";
import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";

import { BottomTabs } from "~/components/Layouts/Navigation";
import { Avatar, Icon, Text, View } from "~/components/ui";
import { api } from "~/utils/api";

const BottomTabsLayout = () => {
  const { data: profileData } = api.profile.getProfile.useQuery({});
  const { data: unreadCount } =
    api.notification.unreadNotificationsCount.useQuery();

  const showBadge = (unreadCount ?? 0) > 0;

  return (
    <BottomTabs
      initialRouteName="(home)"
      backBehavior="history"
      screenOptions={{ headerShown: false }}
    >
      <BottomTabs.Screen
        name="(home)"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name="home"
              color={color}
              size={size}
              iconStyle={{ opacity: focused ? 1 : 0.6 }}
              disabled
            />
          ),
        }}
      />
      <BottomTabs.Screen
        name="(search)"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name="search"
              color={color}
              size={size}
              iconStyle={{ opacity: focused ? 1 : 0.6 }}
              disabled
            />
          ),
        }}
      />
      <BottomTabs.Screen
        name="(camera)"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon
              name="camera"
              color={color}
              size={size}
              iconStyle={{ opacity: focused ? 1 : 0.6 }}
              disabled
            />
          ),
        }}
      />
      <BottomTabs.Screen
        name="(inbox)"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ position: "relative" }}>
              <Icon
                name="notifications"
                color={color}
                size={size}
                iconStyle={{ opacity: focused ? 1 : 0.6 }}
                disabled
              />
              {showBadge && <NotificationBadge count={unreadCount ?? 0} />}
            </View>
          ),
        }}
      />
      <BottomTabs.Screen
        name="(profile)"
        options={{
          tabBarIcon: ({ size, focused }) => (
            <Avatar
              source={profileData?.profilePictureUrl ?? DefaultProfilePicture}
              size={size}
              bordered={focused}
              style={{ opacity: focused ? 1 : 0.6 }}
            />
          ),
        }}
      />
    </BottomTabs>
  );
};

const NotificationBadge = ({ count }: { count: number }) => (
  <View style={styles.badgeContainer}>
    <BlurView
      tint="dark"
      intensity={100}
      style={StyleSheet.absoluteFillObject}
    />
    <View
      backgroundColor="$red11"
      opacity={0.8}
      style={StyleSheet.absoluteFillObject}
    />
    <Text color="white" fontSize={10} fontWeight="bold" textAlign="center">
      {count > 99 ? "99+" : count}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badgeContainer: {
    position: "absolute",
    top: 0,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BottomTabsLayout;

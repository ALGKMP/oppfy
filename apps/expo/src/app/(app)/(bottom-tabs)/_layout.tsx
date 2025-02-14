import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
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

/**
 * A reusable tab bar icon component that applies a "scale" animation
 * when focused. Pass in the icon name or children (for custom content).
 */
const AnimatedTabIcon = ({
  focused,
  size,
  children,
}: {
  focused: boolean;
  size: number;
  children: React.ReactNode;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(focused ? 1.15 : 1, {
          mass: 0.5,
          damping: 12,
          stiffness: 100,
        }),
      },
    ],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

const NotificationBadge = ({ count }: { count: number }) => (
  <MotiView
    from={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      opacity: { type: "timing", duration: 300 },
      scale: { type: "timing", duration: 300 },
    }}
    style={styles.badgeContainer}
  >
    <BlurView
      intensity={100}
      tint="dark"
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
  </MotiView>
);

const BottomTabsLayout = () => {
  const { data: profileData } = api.profile.getFullProfileSelf.useQuery();
  const { data: unreadNotificationsCount } =
    api.notifications.getUnreadNotificationsCount.useQuery();

  const renderIcon =
    (iconName: IconName) =>
    ({ focused, color, size }: TabBarIconProps) => (
      <AnimatedTabIcon focused={focused} size={size}>
        <Icon
          name={iconName}
          color={color}
          size={size}
          iconStyle={{ opacity: focused ? 1 : 0.6 }}
          disabled
        />
      </AnimatedTabIcon>
    );

  return (
    <BottomTabs
      initialRouteName="(home)"
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        // Add any shared screenOptions here if needed
      }}
    >
      <BottomTabs.Screen
        name="(home)"
        options={{
          tabBarIcon: renderIcon("home"),
        }}
      />

      <BottomTabs.Screen
        name="(search)"
        options={{
          tabBarIcon: renderIcon("search"),
        }}
      />

      <BottomTabs.Screen
        name="(camera)"
        options={{
          tabBarIcon: renderIcon("camera"),
        }}
      />

      <BottomTabs.Screen
        name="(inbox)"
        options={{
          tabBarIcon: (props) => {
            const showBadge = (unreadNotificationsCount ?? 0) > 0;
            return (
              <View>
                {renderIcon("notifications")(props)}
                {showBadge && (
                  <NotificationBadge count={unreadNotificationsCount ?? 0} />
                )}
              </View>
            );
          },
        }}
      />

      <BottomTabs.Screen
        name="(profile)"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <AnimatedTabIcon focused={focused} size={size}>
              <Avatar
                // Remove or alter 'circular' styles in your Avatar implementation if you don't want it clipped
                // For instance, if your Avatar automatically makes the image a circle, you can make that configurable
                source={profileData?.profilePictureUrl ?? DefaultProfilePicture}
                size={size}
                bordered={focused}
                style={{ opacity: focused ? 1 : 0.6 }}
              />
            </AnimatedTabIcon>
          ),
        }}
      />
    </BottomTabs>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
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
  },
});

export default BottomTabsLayout;

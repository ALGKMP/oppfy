import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme, View, XStack } from "tamagui";

interface CollapsibleHeaderProps {
  scrollY: Animated.SharedValue<number>;
  title?: string;
  HeaderLeft?: React.ReactNode;
  HeaderRight?: React.ReactNode;
  HeaderTitle?: React.ReactNode;
}

const HEADER_HEIGHT = 50;

const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  scrollY,
  title,
  HeaderLeft,
  HeaderRight,
  HeaderTitle = title ? <DefaultHeaderTitle title={title} /> : null,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [HEADER_HEIGHT + insets.top, insets.top],
      "clamp",
    );

    return {
      height,
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor: theme.background.val,
          paddingTop: insets.top,
        },
      ]}
    >
      <XStack
        paddingVertical="$2"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$background"
        flex={1}
      >
        <View minWidth="$2" alignItems="flex-start">
          {HeaderLeft}
        </View>
        <View alignItems="center">{HeaderTitle}</View>
        <View minWidth="$2" alignItems="flex-end">
          {HeaderRight}
        </View>
      </XStack>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});

const DefaultHeaderTitle = ({ title }: { title: string }) => (
  <Text fontSize="$5" fontWeight="bold">
    {title}
  </Text>
);

export default CollapsibleHeader;

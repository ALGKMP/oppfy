import React, { useState } from "react";
import { StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { Text, View } from "tamagui";

import { BaseScreenView } from "~/components/Views";

const { width: screenWidth } = Dimensions.get('window');

const data = [
  { key: "1" },
  { key: "2" },
  { key: "3" },
  { key: "4" },
  { key: "5" },
  { key: "6" },
  { key: "7" },
  { key: "8" },
  { key: "9" },
];

const MediaOfYou: React.FC = () => {
  const [numColumns, setNumColumns] = useState(2);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Define the min, max, and mid scale values
  const MIN_SCALE = 1;
  const MID_SCALE = 2;
  const MAX_SCALE = 3;

  const SCALES = [MIN_SCALE, MID_SCALE, MAX_SCALE];

  // Find the nearest scale in the predefined scales
  const findNearestScale = (value: number) => {
    'worklet';
    return SCALES.reduce((prev, curr) => {
      return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
    });
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      // Clamp the scale value within the min and max range
      scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, savedScale.value * e.scale));
    })
    .onEnd(() => {
      // Find the nearest scale
      const nearestScale = findNearestScale(scale.value);

      // Set the number of columns based on the snapped scale
      if (nearestScale === MIN_SCALE && numColumns !== 3) {
        runOnJS(setNumColumns)(3);
      } else if (nearestScale === MID_SCALE && numColumns !== 2) {
        runOnJS(setNumColumns)(2);
      } else if (nearestScale === MAX_SCALE && numColumns !== 1) {
        runOnJS(setNumColumns)(1);
      }

      // Reset the scale to normal
      scale.value = withTiming(1);
      savedScale.value = 1;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Calculate item width based on the number of columns
  const getItemWidth = (columns: number) => {
    return (screenWidth - (columns - 1)) / columns;
  };

  const renderItem = ({ item }: { item: { key: string } }) => (
    <View margin={1} style={[styles.item, { width: getItemWidth(numColumns) }]}>
      <Text style={styles.itemText}>{item.key}</Text>
    </View>
  );

  return (
    <BaseScreenView flex={1}>
      <GestureDetector gesture={pinchGesture}>
        <Animated.View style={[styles.box, animatedStyle]}>
          <FlashList
            data={data}
            numColumns={numColumns}
            renderItem={renderItem}
            estimatedItemSize={100}
            key={numColumns} // Important to help FlashList re-render correctly on column change
          />
        </Animated.View>
      </GestureDetector>
    </BaseScreenView>
  );
};

const styles = StyleSheet.create({
  box: {
    flex: 1,
  },
  item: {
    backgroundColor: "#A1A1A1",
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
    height: 90,
  },
  itemText: {
    color: "#fff",
  },
});

export default MediaOfYou;

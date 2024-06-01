import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useDerivedValue } from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { Button, Text, View } from "tamagui";

import { BaseScreenView } from "~/components/Views";

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
  const columnCount = useSharedValue(numColumns);

  const handlePress = () => {
    setNumColumns(1);
    columnCount.value = 1;
  };

  // Derived value to animate grid column transition
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(columnCount.value) }],
    };
  });

  return (
    <BaseScreenView>
      <Button flex={1} onPress={handlePress}>Click me</Button>
      <GestureDetector gesture={Gesture.Tap()}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <FlashList
            data={data}
            numColumns={numColumns}
            renderItem={({ item }) => {
              return (
                <View style={styles.item}>
                  <Text style={styles.itemText}>{item.key}</Text>
                </View>
              );
            }}
            estimatedItemSize={100}
          />
        </Animated.View>
      </GestureDetector>
    </BaseScreenView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    },
  item: {
    backgroundColor: "#A1A1A1",
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
    flex: 1,
    height: 90,
    width: 90,
  },
  itemText: {
    color: "#fff",
  },
});

export default MediaOfYou;

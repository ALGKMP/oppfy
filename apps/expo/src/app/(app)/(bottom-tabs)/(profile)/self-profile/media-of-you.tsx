import React, { useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useSharedValue,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { Text, YStack, XStack, Stack } from "tamagui";

const { width: screenWidth } = Dimensions.get("window");

type DataItem = {
  key: string;
  image: string;
  caption: string;
};

type DataArray = DataItem[];

const data = [
  {
    key: "1",
    image:
      "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Enjoying the sunset!",
  },
  {
    key: "2",
    image:
      "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Delicious breakfast.",
  },
  {
    key: "3",
    image:
      "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Hiking adventures.",
  },
  {
    key: "4",
    image:
      "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Family time.",
  },
  {
    key: "5",
    image:
      "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "City lights.",
  },
  {
    key: "6",
    image:
      "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "At the beach.",
  },
  {
    key: "7",
    image:
      "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Mountain views.",
  },
  {
    key: "8",
    image:
      "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Birthday celebrations.",
  },
  {
    key: "9",
    image:
      "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Night out with friends.",
  },
];


const MediaOfYou: React.FC = () => {
  const [numColumns, setNumColumns] = useState(1);
  const scale = useSharedValue(1);
  const previousScale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Define the scale thresholds for changing the number of columns
  const SCALE_THRESHOLD = 1;

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      "worklet";
      // Track the scale value without animating
      scale.value = savedScale.value * e.scale;

      // Determine the direction of the pinch
      const direction = scale.value > previousScale.value ? "out" : "in";

      // Dynamically set the number of columns based on the direction and threshold
      if (
        direction === "in" &&
        scale.value < previousScale.value / SCALE_THRESHOLD &&
        numColumns < 2
      ) {
        runOnJS(setNumColumns)(2);
        savedScale.value = scale.value; // Update saved scale to new value
      } else if (
        direction === "out" &&
        scale.value > previousScale.value * SCALE_THRESHOLD &&
        numColumns > 1
      ) {
        runOnJS(setNumColumns)(1);
        savedScale.value = scale.value; // Update saved scale to new value
      }

      // Update the previous scale to the current scale
      previousScale.value = scale.value;
    })
    .onEnd(() => {
      "worklet";
      // Reset the scale to normal
      savedScale.value = scale.value;
    });

  // Calculate item width based on the number of columns
  const getItemWidth = (columns: number) => {
    return screenWidth / columns;
  };

  const renderItem = ({
    item,
  }: {
    item: { key: string; image: string; caption: string };
  }) => (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[
        styles.item,
        { width: getItemWidth(numColumns) },
        numColumns === 1 && styles.singleColumnItem,
      ]}
    >
      <Image
        source={{ uri: item.image }}
        style={[
          styles.image,
          numColumns === 1
            ? { height: undefined, aspectRatio: 1, alignSelf: "center" }
            : { height: 200 },
        ]}
        contentFit={numColumns === 1 ? "contain" : "cover"}
      />
      {numColumns === 1 && (
        <YStack position="absolute" bottom={0} width="100%" backgroundColor="rgba(0, 0, 0, 0.5)" padding="$2" borderBottomLeftRadius="$2" borderBottomRightRadius="$2">
          <Text color="#fff" textAlign="center">
            {item.caption}
          </Text>
        </YStack>
      )}
    </Animated.View>
  );

  return (
    <YStack flex={1} margin="$1">
      <GestureDetector gesture={pinchGesture}>
        <Animated.View style={styles.content}>
          <FlashList
            data={data}
            numColumns={numColumns}
            renderItem={renderItem}
            estimatedItemSize={screenWidth / numColumns} // Update to estimated item size
            key={numColumns}
            // keyExtractor={(item) => item.key}
          />
        </Animated.View>
      </GestureDetector>
    </YStack>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    margin: 1,
    borderRadius: 10,
  },
  singleColumnItem: {
    alignItems: "center",
  },
  image: {
    width: "100%",
    borderRadius: 10,
  },
});

export default MediaOfYou;
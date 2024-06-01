import React from "react";
import { Dimensions } from "react-native";
import { Image, styled, Text, View, XStack, YStack } from "tamagui";
import { FlashList } from "@shopify/flash-list";

import { BaseScreenView } from "~/components/Views";

const images: string[] = [
  "https://media.discordapp.net/attachments/923957630878220298/1246237315798667264/image.png?ex=665ba872&is=665a56f2&hm=8b7470c5322afe563f26df4513c4b0ba1c722dda3a1d5a73fdc975e8bba1f04f&=&format=webp&quality=lossless&width=426&height=588",
  "https://media.discordapp.net/attachments/923957630878220298/1246237315798667264/image.png?ex=665ba872&is=665a56f2&hm=8b7470c5322afe563f26df4513c4b0ba1c722dda3a1d5a73fdc975e8bba1f04f&=&format=webp&quality=lossless&width=426&height=588",
  "https://media.discordapp.net/attachments/923957630878220298/1246237315798667264/image.png?ex=665ba872&is=665a56f2&hm=8b7470c5322afe563f26df4513c4b0ba1c722dda3a1d5a73fdc975e8bba1f04f&=&format=webp&quality=lossless&width=426&height=588",
  "https://media.discordapp.net/attachments/923957630878220298/1246237315798667264/image.png?ex=665ba872&is=665a56f2&hm=8b7470c5322afe563f26df4513c4b0ba1c722dda3a1d5a73fdc975e8bba1f04f&=&format=webp&quality=lossless&width=426&height=588",
  "https://media.discordapp.net/attachments/923957630878220298/1246237315798667264/image.png?ex=665ba872&is=665a56f2&hm=8b7470c5322afe563f26df4513c4b0ba1c722dda3a1d5a73fdc975e8bba1f04f&=&format=webp&quality=lossless&width=426&height=588",
  "https://media.discordapp.net/attachments/923957630878220298/1246237315798667264/image.png?ex=665ba872&is=665a56f2&hm=8b7470c5322afe563f26df4513c4b0ba1c722dda3a1d5a73fdc975e8bba1f04f&=&format=webp&quality=lossless&width=426&height=588",
  "https://media.discordapp.net/attachments/923957630878220298/1246237315798667264/image.png?ex=665ba872&is=665a56f2&hm=8b7470c5322afe563f26df4513c4b0ba1c722dda3a1d5a73fdc975e8bba1f04f&=&format=webp&quality=lossless&width=426&height=588",
  "https://media.discordapp.net/attachments/923957630878220298/1246237315798667264/image.png?ex=665ba872&is=665a56f2&hm=8b7470c5322afe563f26df4513c4b0ba1c722dda3a1d5a73fdc975e8bba1f04f&=&format=webp&quality=lossless&width=426&height=588",
  // More images...
];

const numColumns = 3;
const screenWidth = Dimensions.get("window").width;
const imageSize = screenWidth / numColumns;

const MediaOfYou: React.FC = () => {
  return (
    <BaseScreenView>
      <FlashList
        data={images}
        keyExtractor={(item, index) => index.toString()}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{
              width: imageSize,
              height: imageSize,
            }}
            resizeMode="cover"
          />
        )}
        estimatedItemSize={imageSize}
      />
    </BaseScreenView>
  );
};

const styles = {
  image: {
    aspectRatio: 1,
  },
};

export default MediaOfYou;

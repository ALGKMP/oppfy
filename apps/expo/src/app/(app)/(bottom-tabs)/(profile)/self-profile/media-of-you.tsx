import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  nodeFromRef,
  SharedElement,
  SharedElementNode,
  SharedElementTransition,
} from "react-native-shared-element";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { Text, YStack } from "tamagui";

const { width: screenWidth } = Dimensions.get("window");

type DataItem = {
  key: string;
  image: string;
  caption: string;
};

const data: DataItem[] = [
  {
    key: "1",
    image:
      "https://media.discordapp.net/attachments/753611523917742172/1246219424902549607/VUREN5d.png?ex=665d9208&is=665c4088&hm=51c623e4cd5492d8f0774acc9abcf3c923e7e28198cd3cc2bf92be61cd258102&=&format=webp&quality=lossless&width=567&height=548",
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
  const [showSingleColumn, setShowSingleColumn] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DataItem | null>(null);
  const position = useRef(new Animated.Value(0)).current;

  const startAncestor = useRef<SharedElementNode | null>(null);
  const startNode = useRef<SharedElementNode | null>(null);
  const endAncestor = useRef<SharedElementNode | null>(null);
  const endNode = useRef<SharedElementNode | null>(null);

  useEffect(() => {
    if (selectedItem) {
      Animated.timing(position, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(position, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedItem, position]);

  const renderItem = ({ item }: { item: DataItem }) => (
    // <View
    //   ref={(ref) => {
    //     if (ref) startAncestor.current = nodeFromRef(ref);
    //   }}
    // >
    //   <TouchableOpacity
    //     onPress={() => {
    //       setSelectedItem(item);
    //       setShowSingleColumn(true);
    //     }}
    //   >
    //     <SharedElement id={item.key} onNode={(node) => (startNode.current = node)}>
    // <Image source={{ uri: item.image }} style={[styles.image, { height: 200 }]} contentFit="cover" />
    //     </SharedElement>
    //   </TouchableOpacity>
    // </View>

    <View
      ref={(ref) => {
        if (ref) startAncestor.current = nodeFromRef(ref);
      }}
    >
      <Image
        source={{ uri: item.image }}
        style={[styles.image, { height: 200 }]}
        contentFit="cover"
      />
    </View>
  );

  const renderSingleColumnItem = ({ item }: { item: DataItem }) => (
    <View
      ref={(ref) => {
        if (ref) endAncestor.current = nodeFromRef(ref);
      }}
    >
      <TouchableOpacity
        onPress={() => {
          setSelectedItem(null);
          setShowSingleColumn(false);
        }}
      >
        <SharedElement
          id={item.key}
          onNode={(node) => (endNode.current = node)}
        >
          <Image
            source={{ uri: item.image }}
            style={[
              styles.image,
              { height: undefined, aspectRatio: 1, alignSelf: "center" },
            ]}
            contentFit="contain"
          />
          <YStack
            position="absolute"
            bottom={0}
            width="100%"
            backgroundColor="rgba(0, 0, 0, 0.5)"
            padding="$2"
            borderBottomLeftRadius="$2"
            borderBottomRightRadius="$2"
          >
            <Text color="#fff" textAlign="center">
              {item.caption}
            </Text>
          </YStack>
        </SharedElement>
      </TouchableOpacity>
    </View>
  );

  return (
    <YStack flex={1} margin="$1">
      {selectedItem && (
        <View style={StyleSheet.absoluteFill}>
          <SharedElementTransition
            start={{
              node: startNode.current,
              ancestor: startAncestor.current,
            }}
            end={{
              node: endNode.current,
              ancestor: endAncestor.current,
            }}
            position={position}
            animation="move"
            resize="auto"
            align="auto"
          />
        </View>
      )}
      {!showSingleColumn && (
        <Animated.View style={styles.content}>
          <FlashList
            data={data}
            numColumns={2}
            renderItem={renderItem}
            estimatedItemSize={screenWidth / 2}
          />
        </Animated.View>
      )}

      {showSingleColumn && (
        <Animated.View style={styles.content}>
          <FlashList
            data={data}
            numColumns={1}
            renderItem={renderSingleColumnItem}
            estimatedItemSize={screenWidth}
          />
        </Animated.View>
      )}
    </YStack>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  image: {
    width: "100%",
    borderRadius: 10,
  },
});

export default MediaOfYou;

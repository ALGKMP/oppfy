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

  const [progress] = useState(new Animated.Value(0));
  const [isScene2Visible, setIsScene2Visible] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);
  const [scene1Ancestor, setScene1Ancestor] =
    useState<null | SharedElementNode>(null);
  const [scene1Node, setScene1Node] = useState<null | SharedElementNode>(null);
  const [scene2Ancestor, setScene2Ancestor] =
    useState<null | SharedElementNode>(null);
  const [scene2Node, setScene2Node] = useState<null | SharedElementNode>(null);

  const { width } = Dimensions.get("window");

  const onPressNavigate = () => {
    setIsScene2Visible(true);
    setIsInProgress(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => setIsInProgress(false));
  };

  const onPressBack = () => {
    setIsInProgress(true);
    Animated.timing(progress, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setIsScene2Visible(false);
      setIsInProgress(false);
    });
  };

  const onSetScene1Ref = (ref: View | null) => {
    // const node = nodeFromRef(ref);
    // if (node !== scene1Ancestor) {
    //   setScene1Ancestor(node);
    // }
  };

  const onSetScene2Ref = (ref: View | null) => {
    // const node = nodeFromRef(ref);
    // if (node !== scene2Ancestor) {
    //   setScene2Ancestor(node);
    // }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.5}
        onPress={isScene2Visible ? onPressBack : onPressNavigate}
      >
        {/* Scene 1 */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            transform: [{ translateX: Animated.multiply(-200, progress) }],
          }}
        >
          <View style={styles.scene} ref={onSetScene1Ref}>
            <SharedElement onNode={(node) => setScene1Node(node)}>
              <Image
                style={styles.image1}
                source={{
                  uri: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
                }}
              />
            </SharedElement>
          </View>
        </Animated.View>

        {/* Scene 2 */}
        {isScene2Visible ? (
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              transform: [
                {
                  translateX: Animated.multiply(
                    -width,
                    Animated.add(progress, -1),
                  ),
                },
              ],
            }}
          >
            <View style={styles.scene2} ref={onSetScene2Ref}>
              <SharedElement onNode={(node) => setScene2Node(node)}>
                <Image
                  style={styles.image2}
                  source={{
                    uri: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
                  }}
                />
              </SharedElement>
            </View>
          </Animated.View>
        ) : null}
      </TouchableOpacity>

      {/* Transition overlay */}
      {isInProgress ? (
        <View style={styles.sharedElementOverlay} pointerEvents="none">
          <SharedElementTransition
            start={{
              node: scene1Node,
              ancestor: scene1Ancestor,
            }}
            end={{
              node: scene2Node,
              ancestor: scene2Ancestor,
            }}
            position={progress}
            animation="move"
            resize="auto"
            align="auto"
          />
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecf0f1",
  },
  scene: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  scene2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00d8ff",
    justifyContent: "center",
    alignItems: "center",
  },
  image1: {
    resizeMode: "cover",
    width: 160,
    height: 160,
    // Images & border-radius have quirks in Expo SDK 35/36
    // Uncomment the next line when SDK 37 has been released
    //borderRadius: 80
  },
  image2: {
    resizeMode: "cover",
    width: 300,
    height: 300,
    borderRadius: 0,
  },
  sharedElementOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MediaOfYou;

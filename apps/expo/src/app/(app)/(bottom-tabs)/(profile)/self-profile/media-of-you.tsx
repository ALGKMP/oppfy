import React, { useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { FontAwesome } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Heart, MessageCircle } from "@tamagui/lucide-icons";
import { Stack, Text, View, XStack, YStack } from "tamagui";

const { width: screenWidth } = Dimensions.get("window");

type DataItem = {
  author: string;
  authorProfilePicture: string;
  recipient: string;
  recipientProfilePicture: string;

  isFollowing: boolean;
  hasLiked: boolean;

  key: string;
  comments: number;
  likes: number;
  image: string;
  caption: string;
};

const data = [
  {
    author: "JohnDoe",
    authorProfilePicture: "https://example.com/author1.jpg",
    recipient: "JaneSmith",
    recipientProfilePicture: "https://example.com/recipient1.jpg",
    isFollowing: true,
    hasLiked: false,
    key: "1",
    comments: 100,
    likes: 50,
    image: "https://media.discordapp.net/attachments/1246536535382167663/1246669290761879633/image.png?ex=665de380&is=665c9200&hm=f8ad544db1e2d90cf69f85f2927e20ed81594757d6cc89679ff52e881a44b95f&=&format=webp&quality=lossless&width=496&height=638",
    caption: "Enjoying the sunset!",
  },
  {
    author: "JaneSmith",
    authorProfilePicture: "https://example.com/author2.jpg",
    recipient: "JohnDoe",
    recipientProfilePicture: "https://example.com/recipient2.jpg",
    isFollowing: false,
    hasLiked: true,
    key: "2",
    comments: 100,
    likes: 50,
    image: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Delicious breakfast.",
  },
  {
    author: "AliceWang",
    authorProfilePicture: "https://example.com/author3.jpg",
    recipient: "BobJones",
    recipientProfilePicture: "https://example.com/recipient3.jpg",
    isFollowing: true,
    hasLiked: true,
    key: "3",
    comments: 100,
    likes: 50,
    image: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Hiking adventures.",
  },
  {
    author: "BobJones",
    authorProfilePicture: "https://example.com/author4.jpg",
    recipient: "AliceWang",
    recipientProfilePicture: "https://example.com/recipient4.jpg",
    isFollowing: false,
    hasLiked: false,
    key: "4",
    comments: 100,
    likes: 50,
    image: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Family time.",
  },
  {
    author: "CharlieBrown",
    authorProfilePicture: "https://example.com/author5.jpg",
    recipient: "LucyVanPelt",
    recipientProfilePicture: "https://example.com/recipient5.jpg",
    isFollowing: true,
    hasLiked: true,
    key: "5",
    comments: 100,
    likes: 50,
    image: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "City lights.",
  },
  {
    author: "LucyVanPelt",
    authorProfilePicture: "https://example.com/author6.jpg",
    recipient: "CharlieBrown",
    recipientProfilePicture: "https://example.com/recipient6.jpg",
    isFollowing: false,
    hasLiked: false,
    key: "6",
    comments: 100,
    likes: 50,
    image: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "At the beach.",
  },
  {
    author: "EmilyClark",
    authorProfilePicture: "https://example.com/author7.jpg",
    recipient: "DavidSmith",
    recipientProfilePicture: "https://example.com/recipient7.jpg",
    isFollowing: true,
    hasLiked: false,
    key: "7",
    comments: 100,
    likes: 50,
    image: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Mountain views.",
  },
  {
    author: "DavidSmith",
    authorProfilePicture: "https://example.com/author8.jpg",
    recipient: "EmilyClark",
    recipientProfilePicture: "https://example.com/recipient8.jpg",
    isFollowing: false,
    hasLiked: true,
    key: "8",
    comments: 100,
    likes: 50,
    image: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Birthday celebrations.",
  },
  {
    author: "GraceLee",
    authorProfilePicture: "https://example.com/author9.jpg",
    recipient: "HenryMiller",
    recipientProfilePicture: "https://example.com/recipient9.jpg",
    isFollowing: true,
    hasLiked: false,
    key: "9",
    comments: 100,
    likes: 50,
    image: "https://media.discordapp.net/attachments/1246536535382167663/1246588862705438750/IMG_2127.jpg?ex=665cefd9&is=665b9e59&hm=03d95787f0509b92983eb1d626f134508cac0a4ffc18fc7610ffad13548173b5&=&format=webp&width=507&height=676",
    caption: "Night out with friends.",
  },
];

const MediaOfYou = () => {
  const handleLike = (key: string) => {};

  const handleComment = (key: string) => {};

  const renderItem = ({ item }: { item: DataItem }) => (
    <YStack flex={1}>
      <View
        flex={1}
        alignItems="center"
        justifyContent="center"
        borderRadius={10}
        margin={1}
      >
        <Image
          source={{ uri: item.image }}
          style={[styles.image]}
          contentFit="contain"
        />
        <YStack gap="$2" position="absolute" bottom={20} right={20}>
          <View>
            <TouchableOpacity onPress={() => handleLike(item.key)}>
              <Heart size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text color="#fff">{item.likes}</Text>
          <TouchableOpacity onPress={() => handleComment(item.key)}>
            <MessageCircle size={24} color="#fff" />
          </TouchableOpacity>
          <Text color="#fff">{item.comments}</Text>
        </YStack>
        <Text color="#fff" textAlign="center">
          {item.caption}
        </Text>
        <YStack
          position="absolute"
          bottom={0}
          width="100%"
          backgroundColor="rgba(0, 0, 0, 0.5)"
          padding="$2"
          borderBottomLeftRadius="$2"
          borderBottomRightRadius="$2"
        ></YStack>
      </View>
    </YStack>
  );

  return (
    <View flex={1}>
      <FlashList
        data={data}
        numColumns={1}
        renderItem={renderItem}
        estimatedItemSize={screenWidth}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    alignSelf: "center",
    width: "100%",
    padding: 10,
    height: 500,
    borderRadius: 10,
  },
});

export default MediaOfYou;

import React from 'react';
import { View, Button } from "tamagui";
import Animated from 'react-native-reanimated';
import { useRouter } from "expo-router";

const Preview = () => {
  const router = useRouter();

  return (
    <View flex={1} justifyContent="center" alignItems="center">
      <Button onPress={() => router.dismiss()} />
      <Animated.Image
        source={{ uri: "https://media.discordapp.net/attachments/923957630878220298/1244685812373782679/IMG_4341.png?ex=6656037e&is=6654b1fe&hm=5976b732ca6e8f3233d092293fbc9beeebf771947a01f800dd4f3f8902e12d7f&=&format=webp&quality=lossless&width=786&height=676" }}
        style={{ width: "50%", height: "80%" }}
        sharedTransitionTag={"test"}
      />
    </View>
  );
};

export default Preview;

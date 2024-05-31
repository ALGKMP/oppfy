import React from 'react';
import { Image, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { styled } from 'tamagui';
import { Text } from 'tamagui';
import { BaseScreenView } from '~/components/Views';

const images: string[] = [
  'https://media.discordapp.net/attachments/1187121594582175928/1244701739039461486/image.png?ex=6658b554&is=665763d4&hm=1a93340c257d2b205df79b8a7e442234f7fe515d53dd9dcd5fe28ede480c6cce&=&format=webp&quality=lossless&width=844&height=534',
  'https://media.discordapp.net/attachments/1187121594582175928/1244701739039461486/image.png?ex=6658b554&is=665763d4&hm=1a93340c257d2b205df79b8a7e442234f7fe515d53dd9dcd5fe28ede480c6cce&=&format=webp&quality=lossless&width=844&height=534',
  'https://media.discordapp.net/attachments/1187121594582175928/1244701739039461486/image.png?ex=6658b554&is=665763d4&hm=1a93340c257d2b205df79b8a7e442234f7fe515d53dd9dcd5fe28ede480c6cce&=&format=webp&quality=lossless&width=844&height=534',
  'https://media.discordapp.net/attachments/1187121594582175928/1244701739039461486/image.png?ex=6658b554&is=665763d4&hm=1a93340c257d2b205df79b8a7e442234f7fe515d53dd9dcd5fe28ede480c6cce&=&format=webp&quality=lossless&width=844&height=534',
  'https://media.discordapp.net/attachments/1187121594582175928/1244701739039461486/image.png?ex=6658b554&is=665763d4&hm=1a93340c257d2b205df79b8a7e442234f7fe515d53dd9dcd5fe28ede480c6cce&=&format=webp&quality=lossless&width=844&height=534',
  // More images...
];

const MediaOfYou: React.FC = () => {
  const scale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = 1;
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const baseSize = 100;
    const scaledSize = baseSize * scale.value;
    const screenWidth = Dimensions.get('window').width;
    const columns = Math.floor(screenWidth / scaledSize);
    const adjustedSize = screenWidth / columns;

    return {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      width: '100%',
      transform: [{ scale: scale.value }],
      children: {
        width: adjustedSize,
        height: adjustedSize,
      },
    };
  });

  return (
    <BaseScreenView>
      <Text>Media of you</Text>
      <GestureDetector gesture={pinchGesture}>
        <Animated.View style={[animatedStyle, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }]}>
          {images.map((image, index) => (
            <StyledImage key={index} source={{ uri: image }} style={{ width: animatedStyle.children.width, height: animatedStyle.children.height }} />
          ))}
        </Animated.View>
      </GestureDetector>
    </BaseScreenView>
  );
};

export default MediaOfYou;

const StyledImage = styled(Animated.Image, {
  margin: 5,
});

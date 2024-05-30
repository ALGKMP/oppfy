import React from 'react';
import { Image } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { styled } from 'tamagui';
import { Text } from 'tamagui';
import { BaseScreenView } from '~/components/Views';

const images: string[] = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
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
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <BaseScreenView>
      <Text>Media of you</Text>
      <GestureDetector gesture={pinchGesture}>
        <Animated.View style={animatedStyle}>
            {images.map((image, index) => (
              <StyledImage key={index} source={{ uri: image }} />
            ))}
        </Animated.View>
      </GestureDetector>
    </BaseScreenView>
  );
};

export default MediaOfYou;

const StyledImage = styled(Image, {
  width: 100,
  height: 100,
  margin: 5,
});

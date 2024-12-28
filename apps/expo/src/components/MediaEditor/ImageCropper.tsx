import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { Crop, RotateCcw } from "@tamagui/lucide-icons";

import { Text, XStack, YStack } from "~/components/ui";

const ReanimatedView = Reanimated.createAnimatedComponent(View);

interface ImageCropperProps {
  uri: string;
  aspectRatio?: number;
  onCropChange?: (crop: CropRegion) => void;
}

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const DEFAULT_ASPECT_RATIO = 16 / 9;

export const ImageCropper = ({
  uri,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  onCropChange,
}: ImageCropperProps) => {
  // Animation values for crop box
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Store previous values for gesture calculations
  const prevScale = useSharedValue(1);
  const prevRotation = useSharedValue(0);
  const prevTranslateX = useSharedValue(0);
  const prevTranslateY = useSharedValue(0);

  const updateCrop = useCallback(
    (x: number, y: number, scale: number, rotation: number) => {
      if (onCropChange) {
        const width = SCREEN_WIDTH * scale;
        const height = width / aspectRatio;
        onCropChange({
          x,
          y,
          width,
          height,
          rotation,
        });
      }
    },
    [aspectRatio, onCropChange],
  );

  // Gesture handlers
  const panGesture = Gesture.Pan()
    .onStart(() => {
      prevTranslateX.value = translateX.value;
      prevTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = prevTranslateX.value + e.translationX;
      translateY.value = prevTranslateY.value + e.translationY;
      runOnJS(updateCrop)(
        translateX.value,
        translateY.value,
        scale.value,
        rotation.value,
      );
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      prevScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(0.5, Math.min(3, prevScale.value * e.scale));
      runOnJS(updateCrop)(
        translateX.value,
        translateY.value,
        scale.value,
        rotation.value,
      );
    });

  const rotateGesture = Gesture.Rotation()
    .onStart(() => {
      prevRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = prevRotation.value + e.rotation;
      runOnJS(updateCrop)(
        translateX.value,
        translateY.value,
        scale.value,
        rotation.value,
      );
    });

  const composed = Gesture.Simultaneous(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotateGesture),
  );

  // Reset transformations
  const resetTransforms = () => {
    scale.value = withSpring(1);
    rotation.value = withSpring(0);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    updateCrop(0, 0, 1, 0);
  };

  // Animated styles
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${(rotation.value / Math.PI) * 180}deg` },
    ],
  }));

  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <Crop size={16} />
          <Text fontWeight="500">Adjust Image</Text>
        </XStack>
        <TouchableOpacity onPress={resetTransforms}>
          <XStack alignItems="center" gap="$2">
            <RotateCcw size={16} />
            <Text>Reset</Text>
          </XStack>
        </TouchableOpacity>
      </XStack>

      <View style={styles.container}>
        <GestureDetector gesture={composed}>
          <ReanimatedView style={[styles.imageContainer, imageStyle]}>
            <Image source={{ uri }} style={styles.image} contentFit="cover" />
          </ReanimatedView>
        </GestureDetector>

        {/* Crop Guides */}
        <View style={[StyleSheet.absoluteFill, styles.cropGuides]}>
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <View style={styles.gridCell} />
              <View style={styles.gridCell} />
              <View style={styles.gridCell} />
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell} />
              <View style={styles.gridCell} />
              <View style={styles.gridCell} />
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell} />
              <View style={styles.gridCell} />
              <View style={styles.gridCell} />
            </View>
          </View>
        </View>
      </View>

      <Text fontSize="$3" color="$gray11" textAlign="center">
        Pinch to zoom • Rotate with two fingers • Drag to adjust
      </Text>
    </YStack>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH / DEFAULT_ASPECT_RATIO,
    backgroundColor: "#1a1a1a",
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cropGuides: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  gridContainer: {
    flex: 1,
    flexDirection: "column",
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
  },
  gridCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
});

export default ImageCropper;

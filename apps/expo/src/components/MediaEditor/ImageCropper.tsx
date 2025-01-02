import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Crop, RotateCcw } from '@tamagui/lucide-icons';

import { Text, View, XStack, YStack } from '~/components/ui';

const ReanimatedImage = Reanimated.createAnimatedComponent(Image);

interface ImageCropperProps {
  uri: string;
  /** Called whenever the crop region changes (x, y, w, h in *image* coordinates). */
  onCropChange?: (crop: CropRegion) => void;
  /** The width/height aspect ratio of the cropping area. e.g. 1.6 = wide rectangle, 1 = square. */
  aspectRatio?: number;
  /** Max pinch scale allowed (avoid blowing up the image too large). */
  maxScale?: number;
  /** Min pinch scale allowed (avoid going too small). */
  minScale?: number;
}

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Spring config for a smooth reset or clamp transitions. */
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
};

const SCREEN_WIDTH = Dimensions.get('window').width;
/** We can decide how large the crop area is relative to screen. Adjust to your preference. */
const CROP_AREA_WIDTH = SCREEN_WIDTH * 0.9;

export const ImageCropper = ({
  uri,
  onCropChange,
  aspectRatio = 1, // default is square
  maxScale = 5,
  minScale = 1,
}: ImageCropperProps) => {
  /**
   * 1. Setup container dimensions (with aspect ratio).
   */
  const containerWidth = CROP_AREA_WIDTH;
  const containerHeight = containerWidth / aspectRatio;

  /**
   * 2. SharedValues for transformations.
   */
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  /**
   * 3. We'll store the image's natural dimensions.
   *    This can be fetched from an <Image> onLoad event or via pre-known metadata.
   *    For production, you'll want to fetch these properly.
   *    For demonstration, let's just store them in local states or pass them as props.
   */
  const [imageWidth, setImageWidth] = React.useState<number>(0);
  const [imageHeight, setImageHeight] = React.useState<number>(0);

  /**
   * 4. Calculate the minimum initial scale so the image at least fills
   *    the container in one dimension (cover approach).
   */
  const computeInitialScale = useCallback(() => {
    if (!imageWidth || !imageHeight) return 1;

    const containerRatio = containerWidth / containerHeight;
    const imageRatio = imageWidth / imageHeight;

    // "Cover" style: whichever dimension is smaller gets scaled so that container is filled.
    let initialScale = 1;
    if (imageRatio > containerRatio) {
      // Image is relatively wide => match heights
      initialScale = containerHeight / imageHeight;
    } else {
      // Image is relatively tall => match widths
      initialScale = containerWidth / imageWidth;
    }
    return initialScale;
  }, [imageWidth, imageHeight, containerWidth, containerHeight]);

  /**
   * 5. On image load, store the dimensions. Then set initial scale so that
   *    the image fully covers the container.
   */
  const handleImageLoad = useCallback(
    (event: { source: { width: number; height: number } }) => {
      const w = event.source.width;
      const h = event.source.height;
      if (w && h) {
        setImageWidth(w);
        setImageHeight(h);
      }
    },
    []
  );

  /**
   * 6. Whenever we have the real image dimension, reset transforms to fit container.
   */
  useEffect(() => {
    if (imageWidth && imageHeight) {
      resetTransforms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageWidth, imageHeight]);

  /**
   * 7. A function that clamps the translateX and translateY so that the image
   *    never leaves the bounding container, given the current scale.
   */
  const clampImageTransform = useCallback(() => {
    'worklet';

    if (!imageWidth || !imageHeight) return;

    // How large is the image *currently* in the container, given scale?
    const scaledImageWidth = imageWidth * scale.value;
    const scaledImageHeight = imageHeight * scale.value;

    // The amount of extra space outside the container if the image is bigger than the container
    const maxOffsetX = (scaledImageWidth - containerWidth) / 2;
    const maxOffsetY = (scaledImageHeight - containerHeight) / 2;

    // If the image is smaller than container dimension, we center it (no offset).
    // That means translation = 0 in that axis. Otherwise, clamp in that dimension.
    if (scaledImageWidth < containerWidth) {
      translateX.value = 0;
    } else {
      translateX.value = Math.min(Math.max(translateX.value, -maxOffsetX), maxOffsetX);
    }

    if (scaledImageHeight < containerHeight) {
      translateY.value = 0;
    } else {
      translateY.value = Math.min(Math.max(translateY.value, -maxOffsetY), maxOffsetY);
    }
  }, [imageWidth, imageHeight, containerWidth, containerHeight]);

  /**
   * 8. We want to update the "onCropChange" callback whenever transformations change.
   *    We'll compute a region in *image coordinates* that corresponds to the container area.
   */
  const updateCropRegion = useCallback(() => {
    if (!onCropChange) return;
    if (!imageWidth || !imageHeight) return;

    // The container always maps to "0,0 -> containerWidth,containerHeight" in the local space.
    // The image is scaled and translated. We want to find the sub-rectangle of the *original image*.

    // If the image is scaled by `s`, one pixel in the container corresponds to `1/s` pixel in the original image.
    const s = scale.value;

    // The top-left of the container in "image space" is the negative translation offset
    // plus half the difference if image < container dimension. But let's rely on the same logic:
    // If we have a translateX of some value, it means the image center is shifted to the right from the container center.
    // The container center is effectively (0,0). So to find the top-left corner in image space:
    const containerHalfW = containerWidth / 2;
    const containerHalfH = containerHeight / 2;

    // The image center in container coordinates is (translateX, translateY).
    // We want the top-left of the container in *image coordinates*:
    const xInImageSpace =
      (imageWidth / 2 + // center of image in image coords
        -translateX.value / s) -
      containerHalfW / s;
    const yInImageSpace =
      (imageHeight / 2 + // center of image in image coords
        -translateY.value / s) -
      containerHalfH / s;

    // The width/height of the container in image coordinates is containerWidth/s, containerHeight/s
    const wInImageSpace = containerWidth / s;
    const hInImageSpace = containerHeight / s;

    // Clamp so we don't go out of the image
    const clampX = Math.max(0, Math.min(xInImageSpace, imageWidth - wInImageSpace));
    const clampY = Math.max(0, Math.min(yInImageSpace, imageHeight - hInImageSpace));
    const clampW = Math.min(wInImageSpace, imageWidth);
    const clampH = Math.min(hInImageSpace, imageHeight);

    onCropChange({
      x: clampX,
      y: clampY,
      width: clampW,
      height: clampH,
    });
  }, [
    onCropChange,
    imageWidth,
    imageHeight,
    containerWidth,
    containerHeight,
    scale,
    translateX,
    translateY,
  ]);

  /**
   * 9. Pan Gesture
   */
  const panGesture = Gesture.Pan()
    .onUpdate((evt) => {
      translateX.value += evt.translationX;
      translateY.value += evt.translationY;

      clampImageTransform();
      runOnJS(updateCropRegion)();
    });

  /**
   * 10. Pinch Gesture
   */
  const pinchGesture = Gesture.Pinch()
    .onUpdate((evt) => {
      // event.scale is the relative scale from pinch start => multiply with current scale.
      const newScale = scale.value * evt.scale;

      // Bound scale between minScale and maxScale
      scale.value = Math.max(minScale, Math.min(newScale, maxScale));
      clampImageTransform();
      runOnJS(updateCropRegion)();
    });

  /**
   * 11. Reset transforms
   */
  const resetTransforms = useCallback(() => {
    if (!imageWidth || !imageHeight) return;
    const initialScale = computeInitialScale() || 1;

    scale.value = withSpring(initialScale, SPRING_CONFIG);
    translateX.value = withSpring(0, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);

    // We should also update the crop region after the spring finishes,
    // but for simplicity, just do it immediately (slightly off if spring not done).
    setTimeout(() => {
      updateCropRegion();
    }, 50);
  }, [
    imageWidth,
    imageHeight,
    computeInitialScale,
    scale,
    translateX,
    translateY,
    updateCropRegion,
  ]);

  /**
   * 12. Animated style
   */
  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <YStack flex={1} alignItems="center" justifyContent="center">
      <XStack
        width={containerWidth}
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$4"
        paddingHorizontal="$2"
      >
        <XStack alignItems="center" gap="$2">
          <Crop size={16} color="white" />
          <Text fontWeight="500" color="white">
            Pinch & Move
          </Text>
        </XStack>

        <TouchableOpacity onPress={resetTransforms}>
          <XStack alignItems="center" gap="$1">
            <RotateCcw size={16} color="white" />
            <Text color="white">Reset</Text>
          </XStack>
        </TouchableOpacity>
      </XStack>

      {/* Cropping Container */}
      <View
        style={[
          styles.container,
          { width: containerWidth, height: containerHeight },
        ]}
      >
        <GestureDetector gesture={Gesture.Simultaneous(panGesture, pinchGesture)}>
          <Reanimated.View style={[styles.imageWrapper, animatedImageStyle]}>
            <ReanimatedImage
              source={{ uri }}
              style={styles.image}
              onLoad={handleImageLoad}
              contentFit="cover" // or "contain", but typically "cover" for cropping
            />
          </Reanimated.View>
        </GestureDetector>

        {/* Grid Overlay */}
        <View style={styles.gridContainer} pointerEvents="none">
          {/* Vertical lines */}
          <View style={[styles.gridLine, styles.verticalLine, { left: '33.333%' }]} />
          <View style={[styles.gridLine, styles.verticalLine, { left: '66.666%' }]} />
          {/* Horizontal lines */}
          <View style={[styles.gridLine, styles.horizontalLine, { top: '33.333%' }]} />
          <View style={[styles.gridLine, styles.horizontalLine, { top: '66.666%' }]} />
        </View>
      </View>

      <Text fontSize="$3" color="$gray11" textAlign="center" marginTop="$4" maxWidth={300}>
        Use two fingers to pinch (zoom) and one finger to move the image.  
        The 3x3 grid can help you align your composition!
      </Text>
    </YStack>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'black',
    borderRadius: 12,
  },
  imageWrapper: {
    flex: 1,
    // We'll make it bigger than the container so we can see the transforms.
    // Actually, we can just use "position: 'absolute'" if we want.
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  image: {
    // The image itself will be sized by transform scale.
    // By default, set its anchor to center so transforms pivot from the center.
    width: '100%',
    height: '100%',
    // We'll rely on onLoad to get natural image size,
    // and scale it in Reanimated instead.
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  verticalLine: {
    width: 1,
    height: '100%',
  },
  horizontalLine: {
    height: 1,
    width: '100%',
  },
});

export default ImageCropper;

import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { View } from "tamagui";

const AnimatedView = Animated.createAnimatedComponent(View);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  fullSize: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  pattern: {
    position: "absolute",
    opacity: 0.2,
  }
});

interface HeaderGradientProps {
  username: string | null | undefined;
  profilePictureUrl: string | null | undefined;
}

const HeaderGradient = ({ username, profilePictureUrl }: HeaderGradientProps) => {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);
  
  // Animation values
  const gradientProgress = useSharedValue(0);
  const patternProgress = useSharedValue(0);
  
  useEffect(() => {
    // Start continuous gradient animation
    gradientProgress.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1, 
      true
    );
    
    // Start pattern animation
    patternProgress.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Create animated gradient style
  const gradientStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      gradientProgress.value,
      [0, 0.33, 0.66, 1],
      [
        "rgba(130, 130, 255, 0.5)",
        "rgba(130, 210, 255, 0.5)",
        "rgba(180, 130, 255, 0.5)",
        "rgba(130, 130, 255, 0.5)",
      ]
    );

    return {
      backgroundColor,
    };
  });

  // Create animated pattern styles
  const patternStyle1 = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${patternProgress.value * 10}deg` },
        { scale: 1 + patternProgress.value * 0.1 }
      ],
      opacity: 0.1 + patternProgress.value * 0.1,
    };
  });

  const patternStyle2 = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${-patternProgress.value * 15}deg` },
        { scale: 1.1 - patternProgress.value * 0.1 }
      ],
      opacity: 0.15 - patternProgress.value * 0.05,
    };
  });

  // Default gradient background if no profile picture
  if (!profilePictureUrl) {
    return (
      <View style={styles.container}>
        <AnimatedView style={[styles.fullSize, gradientStyle]} />
        <View 
          style={[styles.overlay, { 
            backgroundColor: "rgba(255,255,255,0.1)",
            backgroundImage: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)"
          }]} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Image Background */}
      <Image
        source={profilePictureUrl}
        style={[
          styles.fullSize,
          {
            opacity: isImageLoaded ? 0.5 : 0,
          },
        ]}
        contentFit="cover"
        onLoadEnd={() => setIsImageLoaded(true)}
        transition={200}
      />
      
      {/* Blur Effect */}
      <BlurView
        intensity={85}
        tint="light"
        style={[
          styles.overlay,
          {
            backgroundColor: "rgba(255,255,255,0.1)",
          },
        ]}
      />
      
      {/* Animated Gradient Overlay */}
      <AnimatedView style={[styles.gradientOverlay, gradientStyle]} />
      
      {/* Animated Pattern Overlays */}
      <AnimatedView
        style={[
          styles.pattern,
          patternStyle1,
          {
            width: "120%",
            height: "120%",
            left: "-10%",
            top: "-10%",
            backgroundImage: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2) 0%, transparent 70%)",
          }
        ]}
      />
      
      <AnimatedView
        style={[
          styles.pattern,
          patternStyle2,
          {
            width: "120%",
            height: "120%",
            left: "-10%",
            top: "-10%",
            backgroundImage: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)",
          }
        ]}
      />
    </View>
  );
};

export default HeaderGradient;
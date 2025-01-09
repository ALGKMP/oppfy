import React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Text, View } from "tamagui";

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedView = Animated.createAnimatedComponent(View);

const styles = StyleSheet.create({
  patternText: {
    position: "absolute",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  fullSize: {
    width: "100%",
    height: "100%",
  },
});

interface HeaderGradientProps {
  username: string;
  profilePictureUrl: string | null;
}

const HeaderGradient = ({
  username,
  profilePictureUrl,
}: HeaderGradientProps) => {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);
  // Animation values
  const gradientProgress = useSharedValue(0);

  React.useEffect(() => {
    // Start continuous gradient animation
    gradientProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  // Create abstract pattern elements with animations
  const createAbstractPattern = () => {
    const elements = [];

    // Create floating letters from username
    for (let i = 0; i < username.length; i++) {
      const char = username[i];
      const angle = (i / username.length) * Math.PI * 2;
      const radius = 35 + Math.random() * 10;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;

      const rotation = useSharedValue(angle * (180 / Math.PI));
      const scale = useSharedValue(0.8 + Math.random() * 0.4);

      // Create unique animation for each letter
      React.useEffect(() => {
        rotation.value = withRepeat(
          withTiming(rotation.value + 360, {
            duration: 10000 + Math.random() * 5000,
            easing: Easing.linear,
          }),
          -1,
          true,
        );

        scale.value = withRepeat(
          withSequence(
            withTiming(scale.value * 1.2, {
              duration: 2000 + Math.random() * 1000,
            }),
            withTiming(scale.value, { duration: 2000 + Math.random() * 1000 }),
          ),
          -1,
          true,
        );
      }, []);

      const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
        opacity: withTiming(0.4 + Math.random() * 0.3),
      }));

      elements.push({
        type: "letter",
        char,
        x: x + "%",
        y: y + "%",
        animatedStyle,
      });
    }

    // Add decorative dots
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = 20 + Math.random() * 40;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;

      const dotScale = useSharedValue(1);
      const dotOpacity = useSharedValue(0.1 + Math.random() * 0.2);

      React.useEffect(() => {
        dotScale.value = withRepeat(
          withSequence(
            withDelay(
              Math.random() * 2000,
              withTiming(1.5, { duration: 1500 + Math.random() * 1000 }),
            ),
            withTiming(1, { duration: 1500 + Math.random() * 1000 }),
          ),
          -1,
          true,
        );

        dotOpacity.value = withRepeat(
          withSequence(
            withTiming(0.3, { duration: 2000 }),
            withTiming(0.1, { duration: 2000 }),
          ),
          -1,
          true,
        );
      }, []);

      const animatedDotStyle = useAnimatedStyle(() => ({
        transform: [{ scale: dotScale.value }],
        opacity: dotOpacity.value,
      }));

      elements.push({
        type: "dot",
        x: x + "%",
        y: y + "%",
        size: 2 + Math.random() * 4,
        animatedStyle: animatedDotStyle,
      });
    }

    // Add connecting lines with flow animation
    for (let i = 0; i < 12; i++) {
      const startAngle = (i / 12) * Math.PI * 2;
      const endAngle = ((i + 1) / 12) * Math.PI * 2;
      const radius = 30 + Math.random() * 20;

      const lineProgress = useSharedValue(0);

      React.useEffect(() => {
        lineProgress.value = withRepeat(
          withSequence(
            withDelay(
              i * 200,
              withTiming(1, {
                duration: 2000,
                easing: Easing.inOut(Easing.ease),
              }),
            ),
            withTiming(0, {
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          true,
        );
      }, []);

      const animatedLineStyle = useAnimatedStyle(() => ({
        opacity: lineProgress.value * 0.15,
        transform: [{ scaleX: lineProgress.value }],
      }));

      elements.push({
        type: "line",
        x1: 50 + Math.cos(startAngle) * radius + "%",
        y1: 50 + Math.sin(startAngle) * radius + "%",
        x2: 50 + Math.cos(endAngle) * radius + "%",
        y2: 50 + Math.sin(endAngle) * radius + "%",
        animatedStyle: animatedLineStyle,
      });
    }

    return elements;
  };

  // Gradient animation style
  const gradientStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      gradientProgress.value,
      [0, 0.5, 1],
      [
        "rgba(130, 130, 255, 0.2)",
        "rgba(255, 130, 130, 0.2)",
        "rgba(130, 130, 255, 0.2)",
      ],
    );

    return {
      backgroundColor,
    };
  });

  if (!profilePictureUrl) {
    return (
      <View backgroundColor="$gray3" opacity={0.6} style={styles.fullSize} />
    );
  }

  return (
    <>
      <Image
        source={profilePictureUrl}
        style={[
          styles.fullSize,
          {
            opacity: isImageLoaded ? 0.6 : 0,
          },
        ]}
        contentFit="cover"
        onLoadEnd={() => setIsImageLoaded(true)}
        transition={150}
      />
      <BlurView
        intensity={90}
        tint="light"
        style={[
          styles.fullSize,
          {
            position: "absolute",
            backgroundColor: "rgba(255,255,255,0.15)",
          },
        ]}
      />
      {/* Animated Gradient Overlay */}
      <Animated.View style={[styles.gradientOverlay, gradientStyle]} />

      {/* Abstract Pattern Overlay */}
      <View
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        overflow="hidden"
      >
        {createAbstractPattern().map((element, i) => {
          if (element.type === "letter") {
            return (
              <AnimatedText
                key={`letter-${i}`}
                position="absolute"
                color="white"
                fontSize={32}
                fontWeight="900"
                style={[
                  styles.patternText,
                  {
                    left: element.x,
                    top: element.y,
                  },
                  element.animatedStyle,
                ]}
              >
                {element.char}
              </AnimatedText>
            );
          }

          if (element.type === "dot" && element.size !== undefined) {
            return (
              <AnimatedView
                key={`dot-${i}`}
                position="absolute"
                backgroundColor="white"
                style={[
                  {
                    left: element.x,
                    top: element.y,
                    width: element.size,
                    height: element.size,
                    borderRadius: element.size / 2,
                  },
                  element.animatedStyle,
                ]}
              />
            );
          }

          if (element.type === "line") {
            const x1 = element.x1 || "0%";
            const y1 = element.y1 || "0%";
            const x2 = element.x2 || "0%";
            const y2 = element.y2 || "0%";

            const x1Num = parseFloat(x1);
            const y1Num = parseFloat(y1);
            const x2Num = parseFloat(x2);
            const y2Num = parseFloat(y2);

            return (
              <AnimatedView
                key={`line-${i}`}
                position="absolute"
                backgroundColor="white"
                style={[
                  {
                    position: "absolute",
                    left: x1,
                    top: y1,
                    width: "1px",
                    height: "1px",
                    transform: [
                      {
                        rotate:
                          Math.atan2(y2Num - y1Num, x2Num - x1Num) + "rad",
                      },
                      {
                        scaleX: Math.hypot(x2Num - x1Num, y2Num - y1Num),
                      },
                    ] as any,
                    transformOrigin: "0 0",
                  },
                  element.animatedStyle,
                ]}
              />
            );
          }
        })}
      </View>
    </>
  );
};

export default HeaderGradient;

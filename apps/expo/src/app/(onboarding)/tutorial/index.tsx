import React from "react";
import { Image } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Maya from "@assets/onboarding/Maya.png";
import { Stack, Text, View, XStack, YStack } from "tamagui";

import { ScreenView } from "~/components/ui";
import { OnboardingButton } from "~/components/ui/Onboarding";
import { usePermissions } from "~/contexts/PermissionsContext";

// interface DefaultImageProps {
//   source: any;
//   left?: number;
//   right?: number;
//   top?: number;
//   bottom?: number;
//   zIndex: number;
//   rotate: string;
//   translateX?: number;
//   translateY?: number;
//   scale?: number;
//   width?: number;
//   height?: number;
// }

// const DefaultImage: React.FC<DefaultImageProps> = (props) => {
//   return (
//     <Image
//       source={props.source}
//       style={{
//         width: props.width ?? 180,
//         height: props.height ?? 240,
//         borderRadius: 20,
//         position: "absolute",
//         borderWidth: 5,
//         borderColor: "white",
//         left: props.left,
//         right: props.right,
//         top: props.top,
//         bottom: props.bottom,
//         transform: [
//           { rotate: props.rotate },
//           { translateX: props.translateX ?? 0 },
//           { translateY: props.translateY ?? 0 },
//           { scale: props.scale ?? 0.9 },
//         ],
//         zIndex: props.zIndex,
//       }}
//       resizeMode="cover"
//     />
//   );
// };

export default function Start() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;

  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // if (requiredPermissions) {
    //   router.push("/auth/phone-number");
    // } else {
    //   router.push("/misc/permissions");
    // }
    router.push("/tutorial/screen2")
  };

  return (
    <ScreenView padding={0} safeAreaEdges={["bottom"]}>
      <YStack flex={1} justifyContent="center" alignItems="center">
        {/* Full background collage with randomized images */}
        <Image
          source={Maya}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
        />
        {/* Gradient Overlay and Text/Button */}
        <YStack
          position="absolute"
          bottom={0}
          width="100%"
          height="100%"
          justifyContent="flex-end"
        >
          <LinearGradient
            colors={["transparent", "#F214FF"]}
            locations={[0.6, 1.0]}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <YStack paddingBottom={40} alignItems="center">
              <Text
                fontSize={32}
                fontWeight="bold"
                color="white"
                textAlign="center"
                marginBottom={40}
              >
                post for your friends
              </Text>
              <View
                width="100%"
                paddingHorizontal={24}
                // justifyContent="center"
              >
                <OnboardingButton
                  onPress={onSubmit}
                  isValid
                  text="next"
                />
              </View>
            </YStack>
          </LinearGradient>
        </YStack>
      </YStack>
    </ScreenView>
  );
}

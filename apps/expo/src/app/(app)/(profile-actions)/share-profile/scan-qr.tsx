import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from "react-native-vision-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, View } from "tamagui";

const { width } = Dimensions.get("window");

const ScanQr: React.FC = () => {
  const router = useRouter();

  const device = useCameraDevice("back");
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
    };

    void checkPermissions();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(`/scanned-result?code=${codes[0]?.value}`);
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  if (device === undefined) {
    return (
      <View style={styles.centered}>
        <Text>Camera not available</Text>
      </View>
    );
  }

  return (
    <View flex={1} backgroundColor="$background">
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradient}
      />
      <View style={styles.frameContainer}>
        <View style={styles.frameCornerTopLeft} />
        <View style={styles.frameCornerTopRight} />
        <View style={styles.frameCornerBottomLeft} />
        <View style={styles.frameCornerBottomRight} />
      </View>
    </View>
  );
};

const frameSize = width * 0.6;
const cornerSize = 30;
const borderRadius = 14;
const borderColor = "rgba(128,128,128,0.9)";

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  frameContainer: {
    position: "absolute",
    top: "35%",
    left: "20%",
    width: frameSize,
    height: frameSize,
    zIndex: 2,
  },
  frameCornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: cornerSize,
    height: cornerSize,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderColor,
    borderTopLeftRadius: borderRadius,
  },
  frameCornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: cornerSize,
    height: cornerSize,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor,
    borderTopRightRadius: borderRadius,
  },
  frameCornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: cornerSize,
    height: cornerSize,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor,
    borderBottomLeftRadius: borderRadius,
  },
  frameCornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: cornerSize,
    height: cornerSize,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor,
    borderBottomRightRadius: borderRadius,
  },
  overlay: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
    zIndex: 2,
  },
  text: {
    color: "white",
    fontSize: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 5,
  },
});

export default ScanQr;

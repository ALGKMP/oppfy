import React, { useEffect, useState } from "react";
import { Alert, Linking, Platform, StyleSheet } from "react-native";
import * as Camera from "expo-camera";
import * as Contacts from "expo-contacts";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Check } from "@tamagui/lucide-icons";
import { Button, Checkbox, Text, View, YStack } from "tamagui";

import { useSession } from "~/contexts/SessionsContext";
import { usePermissions } from "../../contexts/PermissionsContext";

const Permissions = () => {
  const router = useRouter();
  const { isSignedIn } = useSession();
  const { permissions, checkPermissions } = usePermissions();

  const openSettings = async () => {
    await Linking.openSettings();
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        "Camera Permission",
        "Camera permission is required for this app. Please enable it in your device settings.",
        [{ text: "Open Settings", onPress: void openSettings }],
      );
    }
    await checkPermissions();
  };

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        "Contacts Permission",
        "Contacts permission is required for this app. Please enable it in your device settings.",
        [{ text: "Open Settings", onPress: void openSettings }],
      );
    }
    await checkPermissions();
  };

  const requestNotificationsPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        "Notifications Permission",
        "Notifications permission is required for this app. Please enable it in your device settings.",
        [{ text: "Open Settings", onPress: void openSettings }],
      );
    }
    await checkPermissions();
  };

  const onPress = () => {
    isSignedIn
      ? router.push("/(app)/(bottom-tabs)/profile")
      : router.push("/auth/phone-number");
  };

  const requiredPermissions = permissions.camera && permissions.contacts;

  return (
    <View
      flex={1}
      padding="$6"
      backgroundColor="black"
      justifyContent="space-between"
    >
      <YStack flex={1}>
        <YStack>
          <Text style={styles.title}>Permissions</Text>
          <Text style={styles.description}>
            This app requires certain permissions to function properly. Please
            allow the necessary permissions to continue.
          </Text>
        </YStack>

        <View style={styles.permissionItem}>
          <Text>Camera</Text>
          <Checkbox
            size="$8"
            onPress={requestCameraPermission}
            checked={permissions.camera}
            disabled={permissions.camera}
          >
            <Checkbox.Indicator>
              <Check />
            </Checkbox.Indicator>
          </Checkbox>
        </View>

        <View style={styles.permissionItem}>
          <Text>Contacts</Text>
          <Checkbox
            size="$8"
            onPress={requestContactsPermission}
            checked={permissions.contacts}
            disabled={permissions.contacts}
          >
            <Checkbox.Indicator>
              <Check />
            </Checkbox.Indicator>
          </Checkbox>
        </View>

        <View style={styles.permissionItem}>
          <Text>Notifications</Text>
          <Checkbox
            size="$8"
            onPress={requestNotificationsPermission}
            checked={permissions.notifications}
            disabled={permissions.notifications}
          >
            <Checkbox.Indicator>
              <Check />
            </Checkbox.Indicator>
          </Checkbox>
        </View>
      </YStack>

      <Button
        onPress={onPress}
        borderWidth={0}
        pressStyle={{
          backgroundColor: "$gray12",
        }}
        disabled={!requiredPermissions}
        backgroundColor={requiredPermissions ? "white" : "$gray9"}
      >
        <Text color="black" fontSize={16} fontWeight="600">
          Continue
        </Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  permissionItem: {
    marginVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default Permissions;

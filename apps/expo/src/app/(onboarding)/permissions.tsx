import React from "react";
import { Platform, StyleSheet } from "react-native";
import * as Camera from "expo-camera";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { SplashScreen, useRouter } from "expo-router";
import { Check } from "@tamagui/lucide-icons";
import { Button, Checkbox, Text, View, YStack } from "tamagui";

import { useSession } from "~/contexts/SessionsContext";
import { usePermissions } from "../../contexts/PermissionsContext";

const Permissions = () => {
  const router = useRouter();

  const { isSignedIn } = useSession();
  const { permissions, checkPermissions } = usePermissions();

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === PermissionStatus.GRANTED) {
      await checkPermissions();
    }
  };

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === PermissionStatus.GRANTED) {
      await checkPermissions();
    }
  };

  const requestNotificationsPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === PermissionStatus.GRANTED) {
      await checkPermissions();
    }
  };

  const requiredPermissions = permissions.camera && permissions.contacts;

  const onPress = () => {
    isSignedIn
      ? router.push("/(app)/(bottom-tabs)/profile")
      : router.push("auth/phone-number");
  };

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
            Poparazzi is a photo sharing app where you create your friend's
            profiles and they create yours. We'll need you to allow a few
            permissions to get started.
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
          Save
        </Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
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

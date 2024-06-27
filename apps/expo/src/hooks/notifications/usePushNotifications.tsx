import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { PermissionStatus } from "expo-notifications";

import { api } from "~/utils/api";

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

const usePushNotifications = (): PushNotificationState => {
  const storePushToken = api.notifications.storePushToken.useMutation();

  Notifications.setNotificationHandler({
    // ! expo typed this promise incorrectly
    // eslint-disable-next-line @typescript-eslint/require-await
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();

  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      throw new Error("Must be using a physical device for Push notifications");
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus !== PermissionStatus.GRANTED) return;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas.projectId as string,
    });

    await storePushToken.mutateAsync({ pushToken: token.data });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  };

  useEffect(() => {
    void registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      if (responseListener.current === undefined) return;
      if (notificationListener.current === undefined) return;

      Notifications.removeNotificationSubscription(
        notificationListener.current,
      );

      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};

export default usePushNotifications;

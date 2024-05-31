import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import * as Camera from "expo-camera";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";

interface PermissionsStatus {
  media: boolean;
  // camera: boolean;
  location: boolean;
  contacts: boolean;
  notifications: boolean;
}

interface PermissionsContextType {
  permissions: PermissionsStatus;
  isLoading: boolean;
  checkPermissions: () => Promise<void>;
}

interface PermissionsProviderProps {
  children: ReactNode;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined,
);

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  const [permissions, setPermissions] = useState<PermissionsStatus>({
    media: false,
    // camera: false,
    location: false,
    contacts: false,
    notifications: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = async () => {
    setIsLoading(true);

    const { status: contactsStatus } = await Contacts.getPermissionsAsync();
    // const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.getMediaLibraryPermissionsAsync();
    const { status: locationStatus } =
      await Location.getForegroundPermissionsAsync();
    const { status: notificationsStatus } =
      await Notifications.getPermissionsAsync();

    setPermissions({
      // camera: cameraStatus === PermissionStatus.GRANTED,
      media: mediaStatus === PermissionStatus.GRANTED,
      location: locationStatus === PermissionStatus.GRANTED,
      contacts: contactsStatus === PermissionStatus.GRANTED,
      notifications: notificationsStatus === PermissionStatus.GRANTED,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        void checkPermissions();
      }
    });

    void checkPermissions(); // Also call it on mount

    return () => {
      subscription.remove();
    };
  }, []);

  const value = { permissions, isLoading, checkPermissions };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};

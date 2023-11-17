import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import * as Camera from "expo-camera";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

type PermissionsStatus = {
  media: boolean;
  camera: boolean;
  location: boolean;
  contacts: boolean;
};

type PermissionsContextType = {
  permissions: PermissionsStatus;
  checkPermissions: () => Promise<void>;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined,
);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [permissions, setPermissions] = useState<PermissionsStatus>({
    media: false,
    camera: false,
    location: false,
    contacts: false,
  });

  const checkPermissions = async () => {
    const { status: contactsStatus } = await Contacts.getPermissionsAsync();
    const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.getMediaLibraryPermissionsAsync();
    const { status: locationStatus } =
      await Location.getForegroundPermissionsAsync();

    setPermissions({
      camera: cameraStatus === Camera.PermissionStatus.GRANTED,
      media: mediaStatus === ImagePicker.PermissionStatus.GRANTED,
      location: locationStatus === Location.PermissionStatus.GRANTED,
      contacts: contactsStatus === Contacts.PermissionStatus.GRANTED,
    });
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

  const value = { permissions, checkPermissions };

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

import { useCallback, useMemo } from "react";
import { useMMKVString } from "react-native-mmkv";
import type { CameraDevice } from "react-native-vision-camera";
import { useCameraDevices } from "react-native-vision-camera";

const usePreferredCameraDevice = () => {
  const [preferredDeviceId, setPreferredDeviceId] = useMMKVString(
    "camera.preferredDeviceId",
  );

  const set = useCallback(
    (device: CameraDevice) => {
      setPreferredDeviceId(device.id);
    },
    [setPreferredDeviceId],
  );

  const devices = useCameraDevices();
  const device = useMemo(
    () => devices.find((d) => d.id === preferredDeviceId),
    [devices, preferredDeviceId],
  );

  return [device, set];
};

export default usePreferredCameraDevice;

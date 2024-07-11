import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { PermissionStatus } from "expo-modules-core";
import * as Notifications from "expo-notifications";

import { api } from "~/utils/api";

export interface SyncContactsStatus {
  status: "error" | "success";
}

const useSyncContacts = (): SyncContactsStatus => {
  return { status: "success" };
};

export default useSyncContacts;

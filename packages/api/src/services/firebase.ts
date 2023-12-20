import admin, { credential } from "firebase-admin";
import type { ServiceAccount } from "firebase-admin/app";
import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import serviceKey from "../../admin-service-account.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceKey as ServiceAccount),
  });
}

export const auth = admin.auth();

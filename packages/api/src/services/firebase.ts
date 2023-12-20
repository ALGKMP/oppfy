import admin, { credential } from "firebase-admin";
import type { ServiceAccount } from "firebase-admin/app";
import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import {
  client_email as clientEmail,
  private_key as privateKey,
  project_id as projectId,
} from "../../admin-service-account.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail,
      privateKey,
      projectId,
    }),
  });
}

export const auth = admin.auth();

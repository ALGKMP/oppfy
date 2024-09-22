import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin/app";

import serviceKey from "./admin-service-account.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceKey as ServiceAccount),
  });
}

export const auth = admin.auth();

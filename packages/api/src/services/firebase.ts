import { credential } from "firebase-admin";
import type {
  ServiceAccount,
} from "firebase-admin/app";
import {
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app"

import { getAuth } from "firebase-admin/auth";

import key from "~/admin-service-account.json";
      
const FIREBASE_APP_NAME = "SERVER";

// Initialize Firebase
const app = getApps().some(({ name }) => name === FIREBASE_APP_NAME)
  ? getApp(FIREBASE_APP_NAME)
  : initializeApp(
      {
        credential: credential.cert(key as ServiceAccount),
        databaseURL:
          "https://flash-li-default-rtdb.europe-west1.firebasedatabase.app",
      },
      FIREBASE_APP_NAME,
    );

const auth = getAuth(app);

export { auth };

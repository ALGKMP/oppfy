import { credential } from "firebase-admin";
import type { ServiceAccount } from "firebase-admin/app";
import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FirebaseAuthError } from 'firebase-admin/lib/utils/error';
// import { FirebaseError } from "firebase-admin/app";

// import key from "~/admin-service-account.json";

// TODO: import as json instead
const key = {
  "type": "service_account",
  "project_id": "oppfy-d63ef",
  "private_key_id": "9d2cf1ca27c39ecd6406f1a2d633b1cc750e80c9",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCmKm9B1dWTGikP\nWiQnCRt334+oBYMaML0qjIzLUMe0VMLInOw/n3iZfq4PWcxNJRPU6fw/oKgpIepS\nSxgWYbKT7Tcnam4hnbZ51ZLAV6+rh5+u94WHtd1Ps3C40qEfPqvpFO/msYwcf026\nYx0p2mQQ8BsoMb/fcMeXIdOYxscY4VuybQyjms6NAL/o5/MnGA3VNmBGZulKdO9N\naRaUaRE4oQRlpvLJ596glIt4Shv+W0urlI4wEcwNVvLYvOorzFKtGQcVFcRjg0KL\nAdFCgdOkBNQHReJnmPz3EPKALovKOSK6D/7Zac3Zl6DRJGuixhF9QLtmOtBVMMZA\nItWh57DHAgMBAAECggEANocCT3ZeSZFyG+mWp4CjlOi1+YslhHit+sJ4iVeO0Sxn\nZvGnzREFwEkD0WHEWyRpp5rI/hA4XpcUj8C4vM9+jHBxguu4DCv273AYYinkKcOt\nsPrkxK33W+okeWIVIW2teCU4vFlTAx77YMiZj1xtLem836nDrw0RUhT1nNLODumM\neeDMJhqU7UyKmwZKwJ3NfVqKypbii+P9YBCsaHZwxgTFDvL7lA+bQTTD0C8hqVFt\n0WDV2GgkBH6QkHFK+BasPOnx5mWuorCHpa4tzjWRuqEhix5e29kmOAK3NQzDUV0H\ni32ctDWzI9b877nqgXb2l6UDWtLK83MrDONDLY384QKBgQDqO5yjhgjxCHc7Tq+C\nGPdTeGQ/3l8+L6RUeEFGTUbDYMpt3AFOJUP4icvuppz4VfHvx0L24WXtlaAhs4/P\ncN145hSbq5SSdHWnuxyQZSgQGFkUBtgB9JXqwM1gl6x34Yo0RJf6RWf5ChKnu/3Q\nQML732Rn5I1CS/AdDxh10QYCCQKBgQC1m4KDRN3w8icBJMSxcXIBPzpab2PofpvV\nLwcMkXlgYjAdUHAF1gCi6z1mK4OMvOukkOPfVVyDopuj5js6qcWvGIgERlijj8lG\nFFHeUlLJ/ris4aW6nemk5hf22qD5q/h2IWpNdFawM1Fx2T3Q+wEPZUyW7kj+1RDH\nSIjcmqiQTwKBgH4oMUuZy4MWzjExRjJKBBv/Ae+sc5voyRd91Zpp0K02mpDlKAbQ\n53Ubsq0NLApNMAu3RQf3ipCWQDMmpVRTM9YEBiF6HoFrHFuE2fOjqBpTItc4gGs9\nMunHglZ+GrRO08MnFrwDWea2WCnjhOb/moVSYp/aZ4LHp8He+YurUxMRAoGBAK1K\nntczt7Ra3O0ycJ4Bao/WDZCOCf+oEHr0TP2pMvDNwKu4PazT7/eGESiVDQoWm6SE\nvWw2v/i8CVf0MUBhD8ls1x19IsewRJcifJxwYZ9t+Dq/dq0EUhaPmP5s0H5tosDW\nUeFmyfGIhobkjSAE45YVS2gaKH1CQqhmhnI7Ae3xAoGAXjSSQ4lyO42PdcKJr/QG\nvQ1K5jugaULtdaUrDKhrO8OyxWe+fH9CE+LGHbiy6sGceCwc9aUUKwMK0o1h52MM\nIFW7RzSLOFD7d9zuN6ZdnsUEiwbd+oUrDHc32VGlAByEgqQmaFrcGg7z5VIHtuob\n1EPI6gKqmzcSJNJpzkATX8U=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-6r8pi@oppfy-d63ef.iam.gserviceaccount.com",
  "client_id": "105541937059235953508",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-6r8pi%40oppfy-d63ef.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

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

const isFireBaseError = (error: unknown): error is FirebaseAuthError => {
  return (error as FirebaseAuthError).code.startsWith('auth/');
};

export { auth, isFireBaseError };

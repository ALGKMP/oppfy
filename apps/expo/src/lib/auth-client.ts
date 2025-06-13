import { createAuthClient } from "better-auth/react"
import { phoneNumberClient } from "better-auth/client/plugins"
import { getBaseUrl } from "~/utils/api"
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
    baseURL: getBaseUrl(),
    plugins: [
        expoClient({
            scheme: "oppfy",
            storagePrefix: "oppfy",
            storage: SecureStore,
        }),
        phoneNumberClient()
    ]
})
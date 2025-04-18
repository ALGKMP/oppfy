import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { jwtDecode } from "jwt-decode";
import superjson from "superjson";

import type { AppRouter } from "@oppfy/api";

import { storage } from "~/utils/storage";
import { getBaseUrl } from "./api";

export const vanillaClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      headers: () => {
        const headers = new Map<string, string>();
        headers.set("x-trpc-source", "expo-react");

        return Object.fromEntries(headers);
      },
      transformer: superjson,
    }),
  ],
});

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
interface User {
  uid: string;
}

class AuthService {
  private user: User | null = null;
  private tokens: AuthTokens | null = null;
  private listeners: (() => void)[] = [];
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    void this.initialize();
  }

  // Initialize auth state from storage
  private async initialize() {
    const storedTokens = storage.getString("auth_tokens");
    if (storedTokens)
      await this.handleTokenRefresh(JSON.parse(storedTokens) as AuthTokens);
    this.scheduleTokenRefresh();
  }

  // State management
  private emitUpdate() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Core auth methods
  public async sendVerificationCode(phoneNumber: string) {
    await vanillaClient.auth.sendVerificationCode.mutate({ phoneNumber });
  }

  public async verifyPhoneNumber(phoneNumber: string, code: string) {
    const result = await vanillaClient.auth.verifyCode.mutate({
      phoneNumber,
      code,
    });
    this.tokens = result.tokens;
    this.user = {
      uid: jwtDecode<{ uid: string }>(result.tokens.accessToken).uid,
    };
    storage.set("auth_tokens", JSON.stringify(result.tokens));
    this.scheduleTokenRefresh();
    this.emitUpdate();

    return {
      isNewUser: result.isNewUser,
    };
  }

  // Token management
  private async handleTokenRefresh(tokens: AuthTokens) {
    try {
      const newTokens = await vanillaClient.auth.refreshToken.mutate({
        refreshToken: tokens.refreshToken,
      });
      this.tokens = newTokens;
      this.user = {
        uid: jwtDecode<{ uid: string }>(newTokens.accessToken).uid,
      };
      storage.set("auth_tokens", JSON.stringify(newTokens));
      this.emitUpdate();
      return true;
    } catch (err) {
      console.log("################################")
      console.error("Error refreshing tokens: ", err);
      console.log("################################")
      this.signOut();
      return false;
    }
  }

  private scheduleTokenRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(
      () => {
        if (this.tokens) void this.handleTokenRefresh(this.tokens);
      },
      60 * 1000 * 1,
    ); // Check every 1 minute
  }

  // Sign out
  public signOut() {
    console.log("SIGNING OUT - IN AUTH SERVICE");
    storage.delete("auth_tokens");
    this.user = null;
    this.tokens = null;
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.emitUpdate();
  }

  // Getters
  public get currentUser() {
    return this.user;
  }
  public get isSignedIn() {
    return !!this.user;
  }
}

export const auth = new AuthService();

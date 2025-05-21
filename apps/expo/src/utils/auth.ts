import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { jwtDecode } from "jwt-decode";
import superjson from "superjson";
import { AppState } from "react-native";

import type { AppRouter } from "@oppfy/api";

import { storage } from "~/utils/storage";
import { getBaseUrl } from "./api";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  uid: string;
}

const ACCESS_REFRESH_BUFFER_MS = 2 * 60 * 1000; // refresh 2 min before expiry

class AuthService {
  private user: User | null = null;
  private tokens: AuthTokens | null = null;
  private listeners: (() => void)[] = [];
  private refreshTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: { remove: () => void } | null = null;

  private readonly client = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: `${getBaseUrl()}/api/trpc`,
        headers: () => ({
          "x-trpc-source": "expo-react",
        }),
      }),
    ],
  });

  constructor() {
    void this.initialize();
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && this.tokens) {
        console.log("[Auth] App came to foreground, checking token validity");
        if (!this.isAccessTokenValid(this.tokens.accessToken)) {
          console.log("[Auth] Token invalid after app resume, attempting refresh");
          void this.handleTokenRefresh(this.tokens);
        } else {
          console.log("[Auth] Token still valid after app resume");
          this.scheduleTokenRefresh();
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async sendVerificationCode(phoneNumber: string) {
    await this.client.auth.sendVerificationCode.mutate({ phoneNumber });
  }

  public async verifyPhoneNumber(phoneNumber: string, code: string) {
    const result = await this.client.auth.verifyCode.mutate({
      phoneNumber,
      code,
    });

    this.setTokens(result.tokens);

    return { isNewUser: result.isNewUser };
  }

  public signOut() {
    console.log("[Auth] Signing out user");
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    storage.delete("auth_tokens");
    this.clearTimer();
    this.user = null;
    this.tokens = null;
    this.emitUpdate();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async initialize() {
    const persisted = storage.getString("auth_tokens");
    if (persisted) {
      const parsed = JSON.parse(persisted) as AuthTokens;
      // If access token is still fresh, reuse it; otherwise attempt refresh.
      if (this.isAccessTokenValid(parsed.accessToken)) {
        this.setTokens(parsed);
      } else {
        const refreshed = await this.handleTokenRefresh(parsed);
        if (!refreshed) this.signOut();
      }
    }
  }

  private setTokens(tokens: AuthTokens) {
    this.tokens = tokens;
    this.user = { uid: jwtDecode<{ uid: string }>(tokens.accessToken).uid };
    storage.set("auth_tokens", JSON.stringify(tokens));
    this.scheduleTokenRefresh();
    this.emitUpdate();
  }

  private emitUpdate() {
    this.listeners.forEach((listener) => listener());
  }

  private clearTimer() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
  }

  private scheduleTokenRefresh() {
    this.clearTimer();
    if (!this.tokens) return;

    const { exp } = jwtDecode<{ exp: number }>(this.tokens.accessToken);
    const msUntilExpiry = exp * 1000 - Date.now();
    const msUntilRefresh = Math.max(
      msUntilExpiry - ACCESS_REFRESH_BUFFER_MS,
      0,
    );

    console.log(`[Auth] Scheduling token refresh in ${msUntilRefresh}ms`);
    this.refreshTimer = setTimeout(() => {
      console.log("[Auth] Token refresh timer triggered");
      if (this.tokens) void this.handleTokenRefresh(this.tokens);
    }, msUntilRefresh);
  }

  private async handleTokenRefresh(tokens: AuthTokens): Promise<boolean> {
    try {
      console.log("[Auth] Attempting to refresh token");
      const newTokens = await this.client.auth.refreshToken.mutate({
        refreshToken: tokens.refreshToken,
      });
      console.log("[Auth] Token refresh successful");
      this.setTokens(newTokens);
      return true;
    } catch (err) {
      console.error("[Auth] Token refresh failed:", err);
      return false;
    }
  }

  private isAccessTokenValid(token: string): boolean {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return exp * 1000 > Date.now() + ACCESS_REFRESH_BUFFER_MS;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  public get currentUser() {
    return this.user;
  }

  public get isSignedIn() {
    return !!this.user;
  }
}

export const auth = new AuthService();

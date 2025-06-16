import { AppState } from "react-native";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { jwtDecode } from "jwt-decode";
import superjson from "superjson";

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

const REFRESH_BUFFER_MS = 30 * 1000; // 30 seconds

export class AuthService {
  private user: User | null = null;
  private tokens: AuthTokens | null = null;
  private subs = new Set<() => void>();
  private refreshPromise: Promise<void> | null = null;

  private client = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: `${getBaseUrl()}/api/trpc`,
        headers: () => ({
          "x-trpc-source": "expo",
          ...(this.tokens && {
            Authorization: `Bearer ${this.tokens.accessToken}`,
          }),
        }),
      }),
    ],
  });

  private unauthenticatedClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: `${getBaseUrl()}/api/trpc`,
        headers: () => ({
          "x-trpc-source": "expo",
        }),
      }),
    ],
  });

  constructor() {
    AppState.addEventListener("change", (s) => s === "active" && this.onWake());
  }

  /* -------- public API ---------- */

  subscribe(fn: () => void) {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  get currentUser() {
    return this.user;
  }

  get isSignedIn() {
    return !!this.user;
  }

  async sendVerificationCode(phoneNumber: string) {
    await this.client.auth.sendVerificationCode.mutate({ phoneNumber });
  }

  async verifyPhoneNumber(phoneNumber: string, code: string) {
    const { tokens, isNewUser } = await this.client.auth.verifyCode.mutate({
      phoneNumber,
      code,
    });
    await this.setTokens(tokens);
    return { isNewUser };
  }

  async ensureValidToken(): Promise<boolean> {
    if (!this.tokens) return false;

    try {
      const decoded = jwtDecode<{ exp: number }>(this.tokens.accessToken);
      const isExpired = decoded.exp * 1000 - Date.now() < REFRESH_BUFFER_MS;

      if (isExpired) {
        if (this.refreshPromise) {
          await this.refreshPromise;
          return true;
        }

        this.refreshPromise = this.refreshTokens();
        await this.refreshPromise;
        this.refreshPromise = null;
      }

      return true;
    } catch {
      this.signOut();
      return false;
    }
  }

  async bootstrap() {
    const raw = storage.getString("auth_tokens");
    if (!raw) return;

    try {
      const persisted = JSON.parse(raw) as AuthTokens;
      await this.setTokens(persisted);
    } catch {
      this.signOut();
    }
  }

  signOut() {
    this.user = null;
    this.tokens = null;
    storage.delete("auth_tokens");
    this.emit();
  }

  /* -------- internals ----------- */

  private async setTokens(tokens: AuthTokens) {
    try {
      const decoded = jwtDecode<{ uid: string; exp: number }>(
        tokens.accessToken,
      );
      this.user = { uid: decoded.uid };
      this.tokens = tokens;
      storage.set("auth_tokens", JSON.stringify(tokens));
      this.emit();
    } catch {
      this.signOut();
    }
  }

  private emit() {
    this.subs.forEach((f) => f());
  }

  private async refreshTokens() {
    if (!this.tokens) return;

    try {
      const next = await this.unauthenticatedClient.auth.refreshToken.mutate({
        refreshToken: this.tokens.refreshToken,
      });
      await this.setTokens(next);
    } catch {
      this.signOut();
    }
  }

  private async onWake() {
    await this.ensureValidToken();
  }
}

export const auth = new AuthService();
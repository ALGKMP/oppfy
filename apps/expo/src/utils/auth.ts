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

const REFRESH_BUFFER_MS = 2 * 60 * 1000; // 2 min

export class AuthService {
  private user: User | null = null;
  private tokens: AuthTokens | null = null;
  private subs = new Set<() => void>();
  private timer: NodeJS.Timeout | null = null;

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

  constructor() {
    void this.bootstrap();
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
    this.setTokens(tokens);
    return { isNewUser };
  }

  signOut() {
    this.clearTimer();
    this.user = null;
    this.tokens = null;
    storage.delete("auth_tokens");
    this.emit();
  }

  /* -------- internals ----------- */

  private async bootstrap() {
    const raw = storage.getString("auth_tokens");
    if (!raw) return;
    const persisted = JSON.parse(raw) as AuthTokens;
    if (this.isAccessFresh(persisted.accessToken)) {
      this.setTokens(persisted);
    } else {
      await this.refreshTokens(persisted);
    }
  }

  private async refreshTokens(tok: AuthTokens) {
    try {
      const next = await this.client.auth.refreshToken.mutate({
        refreshToken: tok.refreshToken,
      });
      this.setTokens(next);
      return true;
    } catch {
      this.signOut();
      return false;
    }
  }

  private setTokens(tok: AuthTokens) {
    this.tokens = tok;
    this.user = { uid: jwtDecode<{ uid: string }>(tok.accessToken).uid };
    storage.set("auth_tokens", JSON.stringify(tok));
    this.scheduleRefresh();
    this.emit();
  }

  private emit() {
    this.subs.forEach((f) => f());
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
  }

  private scheduleRefresh() {
    this.clearTimer();
    if (!this.tokens) return;
    const { exp } = jwtDecode<{ exp: number }>(this.tokens.accessToken);
    const wait = Math.max(exp * 1000 - Date.now() - REFRESH_BUFFER_MS, 0);
    this.timer = setTimeout(() => void this.refreshTokens(this.tokens!), wait);
  }

  private isAccessFresh(token: string) {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return exp * 1000 - Date.now() > REFRESH_BUFFER_MS;
    } catch {
      return false;
    }
  }

  private onWake() {
    if (this.tokens && !this.isAccessFresh(this.tokens.accessToken)) {
      void this.refreshTokens(this.tokens);
    } else {
      this.scheduleRefresh();
    }
  }
}

export const auth = new AuthService();

import React, { createContext, useContext, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { decodeUser, loginWithPassword, serverLogout, type AuthOutcome, type TokenUser } from "@/lib/auth";
import type { PasskeyAssertionJSON } from "@/lib/webauthn";

interface AuthContextType {
  user: TokenUser | null;
  isAuthenticated: boolean;
  // Resolves to "signed-in" (session established) or "step-required" (2FA —
  // see auth.ts's AuthOutcome). Callers decide what "step-required" means;
  // AuthContext itself only updates `user` on a real sign-in.
  //
  // `otp`, `assertion` and `usePasskey` are the second-factor resubmission
  // fields (see loginWithPassword) — pass-through only, so a caller resending
  // with `assertion` or `usePasskey` and NO `otp` (a spent TOTP code must
  // never be resent) reaches the wire exactly as it left the page.
  login: (
    email: string,
    password: string,
    otp?: string,
    assertion?: PasskeyAssertionJSON,
    usePasskey?: boolean,
  ) => Promise<AuthOutcome>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Session = the stored Keycloak access token (identity decoded from claims).
  const [user, setUser] = useState<TokenUser | null>(() => decodeUser());

  const login = useCallback(async (
    email: string,
    password: string,
    otp?: string,
    assertion?: PasskeyAssertionJSON,
    usePasskey?: boolean,
  ): Promise<AuthOutcome> => {
    const outcome = await loginWithPassword(email, password, otp, assertion, usePasskey);
    if (outcome.status === "signed-in") setUser(decodeUser());
    return outcome;
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    // Signup mints the Keycloak user + account + onboarding application (the
    // backend proxies this to user-center) and returns 202 — the account is
    // created DISABLED until the user clicks the verification link mailed to
    // them (2026-08-13 gate). We deliberately do NOT sign in here anymore:
    // Keycloak would answer 401 "Account disabled" for an unverified account,
    // which used to get mis-reported to the user as "Invalid email or
    // password" (a real account, told it doesn't exist). The Signup page
    // shows a "check your email" confirmation instead.
    //
    // A retry after a partial failure (account created, browser dropped
    // before the create call's response landed) hits UC's 409 "already
    // exists" on the create call. Since we no longer log in here, there's no
    // way to tell "already verified" apart from "not yet" without another
    // round-trip — so treat 409 the same as a fresh signup rather than
    // surfacing UC's raw error: the user is told to check their email (the
    // confirmation screen also offers a sign-in link for the "already
    // verified" case).
    try {
      await api.post("/public/signup", { email, password, name });
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 409)) throw err;
    }
  }, []);

  const logout = useCallback(() => {
    void serverLogout(); // clears tokens + revokes the Keycloak session (best-effort)
    setUser(null);
    localStorage.removeItem("mynt_user"); // legacy mock-era key
    localStorage.removeItem("mynt_onboarding");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

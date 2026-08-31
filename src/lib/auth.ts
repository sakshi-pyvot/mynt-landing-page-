// Funnel auth — everything goes through mynt-customer-backend.
//
// The funnel used to run the Keycloak password grant straight from the browser.
// It no longer does: the customer dashboard backend already proxies login /
// refresh / logout to Keycloak (the same `cfd-app` direct-access-grant client),
// so we reuse that and the browser ends up with exactly ONE upstream — the same
// backend that fronts onboarding. Keycloak is now an internal detail.
//
// Tokens still live in localStorage (matching the app's existing persistence
// posture); api.ts refreshes once on a 401 before logging out.

import type { PasskeyAssertionJSON, PasskeyRequestOptionsJSON } from "./webauthn";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5001";

const ACCESS_KEY = "mynt_access_token";
const REFRESH_KEY = "mynt_refresh_token";

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** The backend speaks the {status, code, data, extra, error} envelope. */
interface Envelope<T> {
  status?: string;
  data?: T;
  error?: { message?: string } | null;
}

interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

/**
 * A further-step marker the backend returns with HTTP 200 when the password
 * checked out but the account has 2FA enrolled (TOTP and/or a passkey). This
 * is a STEP of a successful login, not a failure — there's no accessToken
 * yet because Keycloak is waiting on the second factor.
 */
export interface LoginStep {
  otpRequired?: boolean;
  passkeyRequired?: boolean;
  passkeyAvailable?: boolean;
  webauthn?: PasskeyRequestOptionsJSON;
}

type AuthData = Partial<TokenPair> & Partial<LoginStep>;

/**
 * Outcome of a POST to the auth surface. `step-required` is success too (see
 * LoginStep) — callers decide what to do with it. Genuine failures (bad
 * password, disabled account, 5xx, ...) still throw, exactly as before.
 */
export type AuthOutcome =
  | { status: "signed-in"; tokens: TokenPair }
  | { status: "step-required"; step: LoginStep };

/**
 * POST to the backend's auth surface. On success, either tokens are minted
 * and persisted ("signed-in"), or the backend is waiting on a second factor
 * ("step-required" — no tokens yet). The backend maps Keycloak's
 * `invalid_grant` to a 401, so a bad password arrives as a 401 with a human
 * message rather than an OAuth error code.
 */
async function authPost(path: string, body: unknown): Promise<AuthOutcome> {
  const res = await fetch(`${API_URL}/api/auth${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const envelope = (await res.json().catch(() => ({}))) as Envelope<AuthData>;
  const data = envelope.data;

  if (!res.ok || envelope.status === "error") {
    throw new Error(
      envelope.error?.message ?? (res.status === 401 ? "Invalid email or password" : "Sign-in failed"),
    );
  }
  if (data?.accessToken) {
    setTokens(data.accessToken, data.refreshToken);
    return { status: "signed-in", tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken } };
  }
  if (data?.otpRequired || data?.passkeyRequired) {
    return {
      status: "step-required",
      step: {
        otpRequired: data.otpRequired,
        passkeyRequired: data.passkeyRequired,
        passkeyAvailable: data.passkeyAvailable,
        webauthn: data.webauthn,
      },
    };
  }
  // 2xx, status !== "error", but neither tokens nor a recognized step — an
  // unexpected response shape. Treat as a failure rather than doing nothing.
  throw new Error(envelope.error?.message ?? "Sign-in failed");
}

/**
 * `otp`, `assertion` and `usePasskey` are the second-factor resubmission fields
 * (see LoginStep). They are ALTERNATIVES, never combined: a TOTP code is
 * single-use, so a call carrying `assertion` or `usePasskey` must NOT also
 * carry the `otp` from a previous step — re-sending an already-spent code
 * makes Keycloak reject the whole login with "Invalid login credentials"
 * after the passkey ceremony has already completed. Callers are responsible
 * for not passing both; this function only forwards what it's given.
 */
export async function loginWithPassword(
  email: string,
  password: string,
  otp?: string,
  assertion?: PasskeyAssertionJSON,
  usePasskey?: boolean,
): Promise<AuthOutcome> {
  return authPost("/login", {
    email,
    password,
    ...(otp ? { otp } : {}),
    ...(assertion ? { assertion } : {}),
    ...(usePasskey ? { usePasskey: true } : {}),
  });
}

/**
 * Log out for real: clear local tokens AND kill the Keycloak session (the
 * backend does that leg) so the refresh token can't mint new access tokens —
 * the "wrong account → switch account" case. Best-effort: the local session
 * must be gone even if the backend is unreachable.
 */
export async function serverLogout(): Promise<void> {
  const refreshToken = getRefreshToken();
  clearTokens();
  if (!refreshToken) return;
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      keepalive: true, // survives the post-logout navigation
    });
  } catch {
    /* offline / backend down — the local session is already gone */
  }
}

/** One refresh attempt; false (and cleared tokens) when the session is gone. */
export async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    await authPost("/refresh", { refreshToken });
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export interface TokenUser {
  id: string;
  email: string;
  name: string;
}

/** The signed-in user from the access token's claims (null when logged out). */
export function decodeUser(): TokenUser | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return {
      id: payload.sub,
      email: payload.email ?? payload.preferred_username ?? "",
      name: payload.name ?? payload.preferred_username ?? (payload.email ?? "").split("@")[0],
    };
  } catch {
    return null;
  }
}

/**
 * Hand this authenticated session to the CFD app: mint a one-time handoff code
 * at the backend and redirect to `${appUrl}/?handoff=<code>`. The token itself
 * never rides the URL. Any failure (no session, network, non-2xx) degrades to a
 * plain redirect to `appUrl` — the app then shows its normal login. Never throws.
 */
export async function handoffToApp(appUrl: string): Promise<void> {
  const dest = appUrl || "/";
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) {
    window.location.replace(dest);
    return;
  }
  try {
    const res = await fetch(`${API_URL}/api/auth/handoff`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ refreshToken }),
    });
    const envelope = (await res.json().catch(() => ({}))) as Envelope<{ code: string }>;
    const code = envelope.data?.code;
    if (!res.ok || !code) {
      window.location.replace(dest);
      return;
    }
    window.location.replace(`${dest}/?handoff=${encodeURIComponent(code)}`);
  } catch {
    window.location.replace(dest);
  }
}

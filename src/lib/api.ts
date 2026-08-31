// API client for the funnel. Talks to mynt-customer-backend, which proxies
// onboarding through to mynt-user-center — the browser never reaches UC (or
// Keycloak) directly. The backend re-serves UC's routes on the SAME paths
// (/public/*, /me/onboarding/*) under /api, so the call sites below are the
// same strings they always were; only the host changed.
//
// The envelope {status, code, data, extra, error} is identical on both hops:
// this unwraps `.data` on success and throws ApiError otherwise. On a 401 with
// a session, it refreshes once and retries before logging out.
import { clearTokens, getAccessToken, tryRefresh } from "./auth";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5001";
const BASE = `${API_URL}/api`;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body != null ? { "Content-Type": "application/json" } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token && !retried) {
    if (await tryRefresh()) return request<T>(method, path, body, true);
    clearTokens();
    window.location.assign("/login");
  }

  const envelope = (await res.json().catch(() => ({}))) as {
    status?: string;
    data?: T;
    error?: { message?: string } | null;
  };
  if (!res.ok || envelope.status === "error") {
    throw new ApiError(envelope.error?.message ?? `HTTP ${res.status}`, res.status);
  }
  return envelope.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

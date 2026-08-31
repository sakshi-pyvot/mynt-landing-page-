import { getAccessToken } from "@/lib/auth";

// Connection mechanics for the customer onboarding WS relay
// (browser → customer-backend → UC → DIP, frames forwarded verbatim).
// Shared by every onboarding page that listens on it — RestaurantDetection's
// discover.* feed and DataProcessing's ingest.* feed both open the exact
// same socket, so the URL, auth, hello handshake, and frame parsing live in
// one place instead of being copy-pasted per page.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5001";

export interface OnboardingWsFrame {
  type?: string;
  payload?: unknown;
}

export interface OnboardingSocketHandlers {
  onMessage: (msg: OnboardingWsFrame) => void;
  onError?: () => void;
  onClose?: () => void;
}

/** Opens the onboarding WS relay and sends the initial `hello` handshake. */
export function openOnboardingSocket(handlers: OnboardingSocketHandlers): WebSocket {
  const ws = new WebSocket(
    `${API_URL.replace(/^http/i, "ws")}/api/me/onboarding/ws?access_token=${getAccessToken() ?? ""}`,
  );
  ws.onopen = () => ws.send(JSON.stringify({ type: "hello", since_seq: 0 }));
  ws.onmessage = (e) => {
    let msg: OnboardingWsFrame;
    try {
      msg = JSON.parse(e.data as string);
    } catch {
      return;
    }
    handlers.onMessage(msg);
  };
  if (handlers.onError) ws.onerror = handlers.onError;
  if (handlers.onClose) ws.onclose = handlers.onClose;
  return ws;
}

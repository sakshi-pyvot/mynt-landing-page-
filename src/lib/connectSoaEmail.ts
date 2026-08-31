import { api, ApiError } from "@/lib/api";
import { checkGoogleMailbox } from "@/lib/isGoogleMailbox";

export interface SoaEmailRow {
  id: number;
  email: string;
  status: string;
  connectedEmail?: string | null;
  consentUrl: string;
}

export type ConnectSoaResult =
  | { ok: true; row: SoaEmailRow }
  | { ok: false; reason: string };

/**
 * Validate Google/Workspace mailbox, create the SOA row, and open consent.
 * Shared by Connect Email step and Detect “+ Add Email”.
 */
export async function connectSoaEmail(email: string): Promise<ConnectSoaResult> {
  const check = await checkGoogleMailbox(email);
  if (check.ok === false) return { ok: false, reason: check.reason };

  try {
    const row = await api.post<SoaEmailRow>("/me/onboarding/soa-emails", {
      email: email.trim(),
    });
    // Same tab, not a second one. UC now sends a self-serve customer back to
    // /onboarding after consent, and the wizard resumes from server state — so
    // leaving and returning in one tab is the whole journey. Opening a new tab
    // would land that return in the duplicate and leave two funnels open.
    window.location.assign(row.consentUrl);
    return { ok: true, row };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof ApiError ? err.message : "Could not add that email",
    };
  }
}

import { api as defaultApi, ApiError } from "@/lib/api";

// Shape check ONLY — no checksum, no state-code range check.
//
// CONTROLLER RULING (task-8b): the server (/public/gstin/verify) already
// rejects a bad checksum or a nonexistent state without spending a provider
// call, so a client-side copy of that logic buys no cost control — only
// instant feedback, which the regex alone delivers. A second copy of the
// checksum algorithm and the 38-entry state table, in a different language,
// in a repo with no shared package, is duplication that will drift. The
// server stays authoritative on checksum AND on which state codes exist.
const GSTIN_SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function normalize(raw: string): string {
  return (raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidGstinFormat(raw: string): boolean {
  return GSTIN_SHAPE.test(normalize(raw));
}

/** The server's fixed success payload for /public/gstin/verify. */
export interface GstinDetails {
  verified: true;
  gstin: string;
  legalName: string;
  tradeName?: string;
  /**
   * NULL when the register hit carries no principal-place address
   * (`pradr.addr` missing) — UC formats it as null rather than inventing a
   * string, and admin-backend types it the same way. Declaring it as
   * non-null here was a lie the compiler could not catch (strict is off in
   * this repo), and callers wrote that null straight into billingAddress.
   */
  address: string | null;
  stateCode: string;
  stateName: string;
}

export type GstinVerifyResult =
  | { ok: true; details: GstinDetails }
  | { ok: false; reason: string };

interface ApiLike {
  post: <T>(path: string, body?: unknown) => Promise<T>;
}

/**
 * Verifies a GSTIN against UC (proxied through mynt-customer-backend). A
 * shape-invalid input never reaches the network — the server would only
 * reject it too, for free, so skip the round trip. A server rejection
 * (bad checksum, nonexistent state, not found, …) is surfaced as-is via
 * `reason` rather than thrown; `err.message` is already customer-facing text.
 */
export async function verifyGstin(
  raw: string,
  api: ApiLike = defaultApi,
): Promise<GstinVerifyResult> {
  const cleaned = normalize(raw);
  if (!GSTIN_SHAPE.test(cleaned)) {
    return { ok: false, reason: "Enter a valid 15-character GSTIN." };
  }
  try {
    const details = await api.post<GstinDetails>("/public/gstin/verify", { gstin: cleaned });
    return { ok: true, details };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, reason: err.message };
    }
    return { ok: false, reason: "Could not verify GSTIN — try again." };
  }
}

/**
 * State list for the billing-state <select> — presentation only, not used
 * for validation. Codes match the 2-digit GSTIN state-code prefix so a
 * verified GSTIN's `stateCode` drops straight into this list with no mapping.
 * Andhra Pradesh is 37 (the post-bifurcation code, NOT the deprecated 28);
 * there is no 25; 26 is the merged Dadra & Nagar Haveli / Daman & Diu UT;
 * 97 is "Other Territory".
 */
export const GST_STATE_CODES: Array<{ code: string; name: string }> = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
];

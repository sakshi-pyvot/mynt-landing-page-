import { z } from "zod";

const emailSchema = z.string().trim().email();

/** Consumer / known non-Google mailbox domains — Google OAuth cannot connect these. */
const NON_GOOGLE_DOMAINS = new Set([
  "aol.com",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "hotmail.co.uk",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "mail.com",
  "me.com",
  "msn.com",
  "outlook.co.uk",
  "outlook.com",
  "outlook.in",
  "proton.me",
  "protonmail.com",
  "rediffmail.com",
  "yahoo.co.in",
  "yahoo.co.uk",
  "yahoo.com",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "zohomail.com",
]);

const GOOGLE_CONSUMER_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export type GoogleMailboxResult =
  | { ok: true }
  | { ok: false; reason: string };

interface DohMxResponse {
  Status?: number;
  Answer?: Array<{ name?: string; type?: number; data?: string }>;
}

const GOOGLE_MX_SUFFIXES = [".google.com", ".googlemail.com", ".smtp.google.com"];

function domainOf(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase();
}

function isGoogleMxHost(host: string): boolean {
  const h = host.replace(/\.$/, "").toLowerCase();
  return GOOGLE_MX_SUFFIXES.some((suffix) => h === suffix.slice(1) || h.endsWith(suffix));
}

/** Parse "10 aspmx.l.google.com." → host */
function mxHostFromData(data: string): string {
  const parts = data.trim().split(/\s+/);
  return parts[parts.length - 1] ?? data;
}

/**
 * Returns whether an address can be connected via Google OAuth (Gmail or Google Workspace).
 * Custom domains are checked via DNS-over-HTTPS MX lookup.
 */
export async function checkGoogleMailbox(
  rawEmail: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GoogleMailboxResult> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    return { ok: false, reason: "Enter a valid email address." };
  }
  const email = parsed.data.toLowerCase();
  const domain = domainOf(email);
  if (!domain) {
    return { ok: false, reason: "Enter a valid email address." };
  }

  if (GOOGLE_CONSUMER_DOMAINS.has(domain)) {
    return { ok: true };
  }

  if (NON_GOOGLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      reason:
        "Google email required — Outlook and other providers can’t be connected via Google OAuth. Use a Gmail or Google Workspace address.",
    };
  }

  try {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    let res: Response;
    try {
      res = await fetchImpl(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      return {
        ok: false,
        reason: "Couldn’t verify this domain. Check your connection and try again.",
      };
    }
    const body = (await res.json()) as DohMxResponse;
    const answers = body.Answer ?? [];
    if (answers.length === 0) {
      return {
        ok: false,
        reason:
          "This domain doesn’t look like Google Workspace. Use a Gmail or Google Workspace mailbox for payout OAuth.",
      };
    }
    const hasGoogle = answers.some((a) => a.data && isGoogleMxHost(mxHostFromData(a.data)));
    if (hasGoogle) return { ok: true };
    return {
      ok: false,
      reason:
        "This domain doesn’t use Google Workspace. Use a Gmail or Google Workspace mailbox for payout OAuth.",
    };
  } catch {
    return {
      ok: false,
      reason: "Couldn’t verify this domain. Check your connection and try again.",
    };
  }
}

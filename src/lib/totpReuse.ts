/**
 * Remembers the last authenticator code this app SAW ACCEPTED, so a rejection caused by
 * re-using it can be explained properly.
 *
 * WHY THIS IS CLIENT-SIDE. A TOTP code is single-use: Keycloak records the counter it
 * accepted and refuses the same code again, even while the authenticator app is still
 * showing it. That is correct replay protection, but Keycloak deliberately answers with
 * the SAME generic `invalid_grant` it uses for a wrong password, a wrong code and a
 * locked-out account — it must not confirm that a code was valid, because that is an
 * oracle for someone guessing codes. So the server cannot tell the user "you already
 * used that one" without weakening the very property that makes the generic error safe.
 *
 * The CLIENT can, because it is not telling the user anything they did not just type. We
 * only claim reuse when the digits are byte-identical to a code this same browser watched
 * succeed moments ago — knowledge the user already has, and an attacker gains nothing from.
 *
 * The window is short on purpose: a code is valid for one 30s step (plus whatever skew the
 * realm allows), so anything older than this cannot still be the code on screen, and
 * claiming reuse then would be a guess.
 */

const REUSE_WINDOW_MS = 120_000;

/**
 * Module-level, NOT localStorage. The value is worthless once consumed, but there is no
 * reason to persist authenticator material to disk, and in-memory state already survives
 * the only journey that matters: enrol -> sign out -> sign in is an SPA navigation within
 * the same tab, never a page load.
 */
let lastAccepted: { code: string; at: number } | null = null;

/** Digits only, so "123 456" and "123456" are not treated as different codes. */
function normalise(code: string): string {
  return String(code ?? '').replace(/\D/g, '');
}

/** Record a code that the server just ACCEPTED. Never call this on a failure. */
export function rememberAcceptedTotp(code: string | undefined | null): void {
  const digits = normalise(code ?? '');
  if (!digits) return;
  lastAccepted = { code: digits, at: Date.now() };
}

/**
 * True when `code` is the same one we just watched succeed, recently enough that the
 * authenticator app could still be displaying it.
 */
export function isRecentlyUsedTotp(code: string | undefined | null): boolean {
  if (!lastAccepted) return false;
  const digits = normalise(code ?? '');
  if (!digits || digits !== lastAccepted.code) return false;
  return Date.now() - lastAccepted.at < REUSE_WINDOW_MS;
}

/** The one sentence to show instead of "invalid credentials" in that case. */
export const TOTP_REUSED_MESSAGE =
  'You have already used that code. Wait for your authenticator app to show the next one, then try again.';

/** Test seam — there is no product reason to clear this. */
export function __resetTotpReuse(): void {
  lastAccepted = null;
}

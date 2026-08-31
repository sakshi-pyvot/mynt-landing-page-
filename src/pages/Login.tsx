import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { handoffToApp } from "@/lib/auth";
import { APP_URL } from "@/lib/appUrl";
import { getPasskeyAssertion, type PasskeyAssertionJSON, type PasskeyRequestOptionsJSON } from "@/lib/webauthn";
import { rememberAcceptedTotp, isRecentlyUsedTotp, TOTP_REUSED_MESSAGE } from "@/lib/totpReuse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

type Step = "credentials" | "otp";
// Distinct from `step`: which in-flight call is running, so the two ceremonies
// (typing a code vs. running a passkey) each get their own busy state instead
// of a single generic "loading" flag.
type SubmitTarget = null | "password" | "otp" | "passkey";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("credentials");
  const [otp, setOtp] = useState("");
  // The account ALSO has a passkey, so the code screen can offer it as an alternative.
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [submitting, setSubmitting] = useState<SubmitTarget>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const routed = useRef(false);
  // Set by mynt-customer-backend when it redirects a clicked verification
  // link here: `<funnel>/login?verified=1`. Fixed contract — the param name
  // and value are agreed with the backend, don't rename.
  const [searchParams] = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";

  // Route an authenticated session — freshly logged in OR already signed in on
  // this device — to where it belongs, by onboarding stage:
  //   • "live" + historic backfill done  → the CFD app via a one-time handoff
  //   • "live" + backfill still filling   → /processing to watch it
  //   • anything else                     → /onboarding, resuming the paused step
  // If the stage read fails, fall through to the wizard (it re-fetches + resumes,
  // or force-logs-out a dead session). Guarded so it runs at most once.
  const routeAfterAuth = async () => {
    if (routed.current) return;
    routed.current = true;
    try {
      const { stage } = await api.get<{ stage: string }>("/me/onboarding");
      if (stage === "live") {
        try {
          const ing = await api.get<{ state?: { historicBackfillComplete?: boolean } }>("/me/onboarding/ingestion");
          if (ing?.state?.historicBackfillComplete) {
            // handoffToApp never throws (it falls back to a plain APP_URL
            // redirect) and navigates away, so we don't fall through here.
            await handoffToApp(APP_URL || "/");
            return;
          }
        } catch {
          /* can't read ingestion status — fall through to /processing */
        }
        navigate("/processing");
        return;
      }
    } catch {
      /* fall through to the wizard, which re-fetches + resumes */
    }
    navigate("/onboarding");
  };

  // Already signed in when hitting /login (came back to the landing and clicked
  // "Log in") — don't show the form again; route straight through as if we'd
  // just logged in. The token persists in localStorage, so this survives a
  // return visit; an expired token degrades to the normal login on the next hop.
  useEffect(() => {
    if (isAuthenticated) void routeAfterAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  /**
   * One sign-in attempt.
   *
   * `usePasskey` is the user choosing their passkey over their authenticator app. The two
   * factors are ALTERNATIVES — satisfying either completes the login. They must never
   * chain: resubmitting with an `assertion` or `usePasskey` while ALSO carrying `code`
   * would re-send an already-spent TOTP code, and Keycloak rejects that with "Invalid
   * login credentials" — AFTER whichever ceremony ran has already completed. That is why
   * every resubmission below passes exactly the proof for that path and nothing else.
   */
  const submit = async (code?: string, usePasskey?: boolean) => {
    setError(null);
    setSubmitting(usePasskey ? "passkey" : code ? "otp" : "password");
    try {
      const outcome = await login(email, password, code, undefined, usePasskey);
      if (outcome.status === "step-required") {
        if (outcome.step.otpRequired) {
          setPasskeyAvailable(Boolean(outcome.step.passkeyAvailable));
          setStep("otp");
          setSubmitting(null);
          return;
        }
        // Passkey second factor. The password was ACCEPTED and Keycloak issued a
        // challenge; sign it here — immediately, no extra click — and resubmit.
        // This used to redirect to the dashboard's own /login, which made the user
        // retype the email and password they had just entered.
        if (outcome.step.passkeyRequired) {
          setSubmitting("passkey");
          if (!outcome.step.webauthn) {
            setError("Sign-in failed — please try again");
            setSubmitting(null);
            return;
          }
          const assertion: PasskeyAssertionJSON = await getPasskeyAssertion(
            outcome.step.webauthn as PasskeyRequestOptionsJSON,
          );
          // Deliberately NO `code` here — see the CRITICAL note on `submit` above. A
          // TOTP code is single-use; the assertion is the whole proof on this path.
          const second = await login(email, password, undefined, assertion);
          if (second.status === "signed-in") {
            // routeAfterAuth navigates away, so we leave `submitting` set.
            await routeAfterAuth();
            return;
          }
          // Anything else here means the assertion did not complete the login.
          // Do NOT fall back to a redirect — that is the loop this feature removed.
          setError("Passkey sign-in could not be completed. Please try again.");
          setSubmitting(null);
          return;
        }
        return;
      }
      // Signed in.
      if (code) {
        // The server accepted this code, so it is now spent. Remembering it lets a
        // later rejection of the SAME digits be explained as reuse rather than as
        // "invalid credentials" — Keycloak cannot tell us that apart (see totpReuse).
        rememberAcceptedTotp(code);
      }
      // routeAfterAuth navigates away, so we leave `submitting` set.
      await routeAfterAuth();
    } catch (err) {
      // A code this browser just watched succeed cannot work twice — TOTP codes are
      // single-use even while the authenticator is still showing them. Keycloak answers
      // with the same generic "invalid credentials" it uses for a wrong password, so say
      // the useful thing here instead of repeating it.
      if (code && isRecentlyUsedTotp(code)) {
        setError(TOTP_REUSED_MESSAGE);
      } else {
        setError(err instanceof Error ? err.message : "Sign-in failed — please try again");
      }
      setSubmitting(null);
    }
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit();
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    void submit(otp);
  };

  const handleUsePasskey = () => {
    void submit(undefined, true);
  };

  const backToCredentials = () => {
    setStep("credentials");
    setOtp("");
    setPasskeyAvailable(false);
    setError(null);
  };

  // Don't flash the login form while an existing session is being routed away.
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <span className="text-muted-foreground text-sm">Taking you to your dashboard…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mb-8">
          <span className="text-2xl font-bold text-gradient-mint">mynt</span>
          <h1 className="text-2xl font-bold text-foreground mt-4">Welcome back</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sign in to your account</p>
        </div>

        {justVerified && step === "credentials" && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Email verified — sign in to continue.
          </div>
        )}

        {step === "credentials" && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" required
                placeholder="you@restaurant.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-border h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" required
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-border h-11"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting !== null} className="w-full gradient-mint text-primary-foreground hover:opacity-90 h-11">
              {submitting === "password"
                ? "Signing in..."
                : submitting === "passkey"
                  ? "Confirming passkey…"
                  : "Sign in"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Authentication code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="bg-secondary border-border h-11 text-center text-lg tracking-[0.5em]"
              />
              <p className="text-xs text-muted-foreground">
                Enter the code from your authenticator app ·{" "}
                <button
                  type="button"
                  onClick={backToCredentials}
                  className="text-primary hover:underline"
                >
                  Use a different account
                </button>
              </p>
            </div>

            {/* The two factors are ALTERNATIVES — either one completes the login.
                Only offered when this account actually has a passkey. */}
            {passkeyAvailable && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUsePasskey}
                disabled={submitting !== null}
                className="w-full h-11 gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                {submitting === "passkey" ? "Confirming passkey…" : "Use a passkey instead"}
              </Button>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting !== null} className="w-full gradient-mint text-primary-foreground hover:opacity-90 h-11">
              {submitting === "otp" ? "Verifying..." : "Verify & continue"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

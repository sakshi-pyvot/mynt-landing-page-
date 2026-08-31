import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mail, Plus, Shield, Trash2, ExternalLink } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { api } from "@/lib/api";
import { connectSoaEmail, type SoaEmailRow } from "@/lib/connectSoaEmail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Real Gmail connect (SCRUM-72 Phase 5): the SAME OAuth flow the admin emails
// out, done inline — add the payout mailbox, grant access in the Google popup,
// and this list flips to Connected when UC's callback lands the credential.
// The prototype's six mock sub-steps (fake consent, scan theater, detection
// flags) are gone; detection happens on the next page from real ingestion.

export default function ConnectEmail() {
  const { data, updateData } = useOnboarding();
  const [rows, setRows] = useState<SoaEmailRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState(data.financeEmail || "");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncToContext = (list: SoaEmailRow[]) => {
    // The wizard's Continue gate reads connectedEmails — mirror Connected rows.
    updateData({
      connectedEmails: list
        .filter((r) => r.status === "Connected")
        .map((r) => ({
          id: String(r.id),
          email: r.connectedEmail ?? r.email,
          provider: "gmail" as const,
          selected: true,
          zomatoFound: false,
          swiggyFound: false,
          attachmentsFound: false,
          status: "connected" as const,
        })),
    });
  };

  const load = async () => {
    try {
      const list = await api.get<SoaEmailRow[]>("/me/onboarding/soa-emails");
      setRows(list);
      syncToContext(list);
    } catch {
      /* transient — next poll retries */
    }
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 4000); // flips rows to Connected after the OAuth popup
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addEmail = async () => {
    setError(null);
    setConnecting(true);
    try {
      const result = await connectSoaEmail(newEmail);
      if (result.ok === false) {
        setError(result.reason);
        return;
      }
      setRows((prev) => [...prev, result.row]);
      setAdding(false);
      setNewEmail("");
    } finally {
      setConnecting(false);
    }
  };

  const removeEmail = async (id: number) => {
    try {
      await api.del(`/me/onboarding/soa-emails/${id}`);
      const next = rows.filter((r) => r.id !== id);
      setRows(next);
      syncToContext(next);
    } catch {
      /* row list refreshes on the next poll */
    }
  };

  const connected = rows.filter((r) => r.status === "Connected");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Connect Your Payout Email</h2>
        <p className="text-muted-foreground mt-1">
          Grant read-only access to the mailbox that receives Zomato/Swiggy payout emails.
        </p>
      </div>

      {/* Connected / pending list */}
      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
              {r.status === "Connected" ? (
                <div className="w-9 h-9 rounded-full gradient-mint flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{r.connectedEmail ?? r.email}</div>
                <div className={`text-xs ${r.status === "Connected" ? "text-primary" : "text-muted-foreground"}`}>
                  {r.status === "Connected" ? "Connected — payout emails accessible" : "Waiting for Google authorization…"}
                </div>
              </div>
              {/* Same tab as the initial connect (see lib/connectSoaEmail):
                  UC returns a self-serve customer to /onboarding afterwards. */}
              {r.status !== "Connected" && (
                <Button variant="outline" size="sm" onClick={() => window.location.assign(r.consentUrl)} className="text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" /> Authorize
                </Button>
              )}
              <button onClick={() => removeEmail(r.id)} className="text-muted-foreground hover:text-destructive p-1" aria-label="Remove email">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add mailbox */}
      {adding ? (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <label className="text-sm font-medium text-foreground" htmlFor="soa-email">Payout mailbox (Gmail / Google Workspace)</label>
          <div className="flex gap-2">
            <Input
              id="soa-email"
              type="email"
              placeholder="payouts@yourrestaurant.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-secondary border-border h-11"
              disabled={connecting}
            />
            <Button
              onClick={addEmail}
              disabled={connecting || !newEmail.includes("@")}
              className="gradient-mint text-primary-foreground h-11"
            >
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            A Google window will open — sign in with this mailbox and grant read-only access.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full p-4 rounded-xl border border-dashed border-border bg-secondary/40 hover:border-primary/40 transition-colors flex items-center justify-center gap-2 text-sm text-foreground"
        >
          <Plus className="h-4 w-4" /> {rows.length ? "Add another mailbox" : "Connect a Gmail mailbox"}
        </button>
      )}

      {/* Trust copy */}
      <div className="glass-card rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="text-sm font-medium text-foreground">Payout emails only</p>
          <p>Read-only access, used exclusively to fetch Zomato & Swiggy payout statements. Personal email is never read, and access can be revoked anytime from your Google account.</p>
        </div>
      </div>

      {connected.length === 0 && rows.length > 0 && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" /> Finish the Google authorization to continue.
        </p>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useOnboarding, type DetectedRestaurant } from "@/contexts/OnboardingContext";
import { Loader2, Check, RefreshCw, Inbox, Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { connectSoaEmail } from "@/lib/connectSoaEmail";
import { openOnboardingSocket, type OnboardingWsFrame } from "@/lib/onboardingSocket";

// Real detection (SCRUM-72 + DIP res-id discovery): entering this step triggers
// a subject-only inbox scan and listens on UC's WebSocket feed for the scan's
// lifecycle (resid_found → completed/failed) — so the loader genuinely STOPS
// when the scan ends, including the found-nothing case. Polling the durable
// read model stays as the fallback when the socket can't connect.

export interface DiscoveredResId {
  platform: string;
  resId: string;
  name: string | null;
  mapped: boolean;
  mappedOutletId: number | null;
  mappedOutletName: string | null;
}

type ScanState = "scanning" | "done" | "failed";

export const toDetected = (rows: DiscoveredResId[]): DetectedRestaurant[] =>
  rows.map((it) => ({
    id: `${it.platform}:${it.resId}`,
    platformId: it.resId,
    platform: (it.platform === "swiggy" ? "swiggy" : "zomato"),
    name: it.name ?? `Restaurant ${it.resId}`,
    mailbox: "",
    mappedOutletName: it.mappedOutletName ?? undefined,
  }));

function AddEmailCard({ onConnected }: { onConnected: () => void }) {
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingIdRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const watchUntilConnected = (id: number) => {
    pendingIdRef.current = id;
    if (pollRef.current) clearInterval(pollRef.current);
    let ticks = 0;
    pollRef.current = setInterval(async () => {
      ticks += 1;
      try {
        const list = await api.get<Array<{ id: number; status: string }>>("/me/onboarding/soa-emails");
        const row = list.find((r) => r.id === id);
        if (row?.status === "Connected") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          onConnected();
        }
      } catch {
        /* next tick */
      }
      if (ticks >= 45 && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 4000);
  };

  const submit = async () => {
    setError(null);
    setConnecting(true);
    try {
      const result = await connectSoaEmail(email);
      if (result.ok === false) {
        setError(result.reason);
        return;
      }
      setAdding(false);
      setEmail("");
      watchUntilConnected(result.row.id);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
          <Mail className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">Missing some restaurants?</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect additional email accounts to detect more restaurant IDs from Zomato & Swiggy.
          </p>
          {adding && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="payouts@yourrestaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border h-10"
                  disabled={connecting}
                />
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={connecting || !email.includes("@")}
                  className="gradient-mint text-primary-foreground h-10 shrink-0"
                >
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>
      </div>
      {!adding && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          className="shrink-0 self-start sm:self-center"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Email
        </Button>
      )}
    </div>
  );
}

export default function RestaurantDetection() {
  const { data, updateData } = useOnboarding();
  const [scanState, setScanStateLocal] = useState<ScanState>("scanning");
  const [scanError, setScanError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanStateRef = useRef<ScanState>("scanning");
  scanStateRef.current = scanState;
  // True when the account is already live: no discovery job runs for it, so the
  // list is fed by the ingest scan and we follow ingest.* frames instead.
  const liveFeedRef = useRef(false);
  // Mirrors data.detectedRestaurants every render so the WS handler (a
  // closure captured once in the mount effect) always appends onto the
  // latest list instead of a stale one from whichever render set up the
  // socket.
  const detectedRef = useRef<DetectedRestaurant[]>(data.detectedRestaurants);
  detectedRef.current = data.detectedRestaurants;

  const setScanState = (state: ScanState) => {
    setScanStateLocal(state);
    updateData({ detectionScanState: state });
  };

  const load = async (): Promise<number> => {
    try {
      const r = await api.get<{
        resIds?: DiscoveredResId[];
        scan?: { status?: "idle" | "running" | "completed" | "failed"; reason?: string | null };
      }>("/me/onboarding/detected");
      const rows = r.resIds ?? [];
      const fromRest = toDetected(rows);
      // REST is reconcile, but a mid-flight GET must not erase res-ids that
      // already arrived via discover.resid_found before the read model caught up.
      const byId = new Map(fromRest.map((x) => [x.id, x]));
      for (const local of detectedRef.current) {
        if (!byId.has(local.id)) byId.set(local.id, local);
      }
      const detected = Array.from(byId.values());
      detectedRef.current = detected;
      updateData({ detectedRestaurants: detected });
      // The POLL is authoritative for scan completion — `scan.status` is derived
      // from DIP's durable discover.* event log. The WS discover.completed frame
      // is only a fast path; if it's dropped/never delivered (as it was), the
      // next 6s poll still settles the step. No client-side timer, ever.
      const status = r.scan?.status;
      if (scanStateRef.current === "scanning") {
        if (status === "completed") finish("done");
        else if (status === "failed") finish("failed", r.scan?.reason ?? "The scan failed — try again.");
        // Already-live account: no discovery job runs, so `status` stays "idle"
        // and its res-ids arrive from the ingest scan — finish once any land.
        else if (liveFeedRef.current && rows.length > 0) finish("done");
      }
      return rows.length;
    } catch (err) {
      // Rate-limited or pipeline warming up — the next poll/event retries. But
      // say so: swallowing this silently is what let a permanently-empty list
      // look like a finished scan with a clean console.
      console.warn("[detect] could not read the discovered list", err);
      return -1;
    }
  };

  const finish = (state: ScanState, reason?: string) => {
    // Update the ref synchronously: finish() calls load(), and load() finishes
    // on a terminal scan.status — without this the re-entrant load() would still
    // read "scanning" (the ref only syncs on render) and finish again in a loop.
    scanStateRef.current = state;
    setScanState(state);
    if (reason) setScanError(reason);
    void load();
  };

  // Appends one live discover.resid_found frame straight into the detected
  // list — no REST round-trip. Dedups by the same `${platform}:${resId}` key
  // `toDetected` uses, so a resend (retry, redrive) can't double-add a row.
  const appendDiscovered = (row: { platform: string; resId: string; name?: string | null }) => {
    const id = `${row.platform}:${row.resId}`;
    if (detectedRef.current.some((r) => r.id === id)) return;
    const next: DetectedRestaurant = {
      id,
      platformId: row.resId,
      platform: row.platform === "swiggy" ? "swiggy" : "zomato",
      name: row.name ?? `Restaurant ${row.resId}`,
      mailbox: "",
    };
    const updated = [...detectedRef.current, next];
    detectedRef.current = updated;
    updateData({ detectedRestaurants: updated });
  };

  // The WS is a FAST PATH only: it relays UC's feed of DIP's durable discovery
  // events so found res-ids + completion can show instantly. It is not required —
  // the 6s REST poll (load) reads the authoritative scan.status, so a socket that
  // never connects, drops, or stays silent can no longer strand the step.
  const openSocket = () => {
    try {
      wsRef.current = openOnboardingSocket({
        onMessage: (msg: OnboardingWsFrame) => {
          const payload = msg.payload as
            | { reason?: string; platform?: string; resId?: string; name?: string | null }
            | undefined;
          if (msg.type === "discover.resid_found") {
            const { platform, resId, name } = payload ?? {};
            if (platform && resId) appendDiscovered({ platform, resId, name });
          }
          else if (msg.type === "discover.completed") finish("done");
          else if (msg.type === "discover.failed") finish("failed", payload?.reason ?? "The scan failed — try again.");
          // A live account emits NO discover.* frames — its res-ids come from the
          // ingest scan (ingest.* / run.*). Without these the socket is open but
          // silent for that account, and the page only ever updated on a manual
          // refresh. Guarded on liveFeedRef so a stray run frame can't cut a real
          // discovery scan short.
          else if (!liveFeedRef.current) return;
          else if (msg.type === "ingest.run_completed" || msg.type === "run.completed") finish("done");
          else if (msg.type === "ingest.progress" || msg.type === "ingest.run_started") void load();
        },
        onError: () => {},
        onClose: () => {},
      });
    } catch {
      /* no socket — the REST poll is the source of truth */
    }
  };

  const startScan = async () => {
    setScanError(null);
    setScanState("scanning");
    liveFeedRef.current = false;
    try {
      const r = await api.post<{ scanning: boolean; active?: boolean }>("/me/onboarding/detect", {});
      // Already-live account: no discovery job runs — the ingest cycle feeds the
      // same store. Do NOT call it done here: the ingest scan usually hasn't
      // written its res-ids yet, so declaring the scan over showed an empty
      // "No Restaurants Found" and stopped the poll — the rows only appeared on
      // a manual refresh. Watch the feed instead and finish when it says so
      // (or when the fallback timer gives up).
      if (r.active) {
        liveFeedRef.current = true;
        if ((await load()) > 0) finish("done"); // results already there — show them
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) finish("failed", err.message);
      else console.warn("[detect] could not start the scan", err);
      /* other failures: prior results may exist — the poll keeps the list warm */
    }
  };

  useEffect(() => {
    updateData({ detectionScanState: "scanning" });
    void load();
    void startScan();
    openSocket();
    pollRef.current = setInterval(() => {
      if (scanStateRef.current === "scanning") void load();
    }, 6000);
    return () => {
      wsRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rescan = async () => {
    setRefreshing(true);
    await startScan();
    if (!wsRef.current || wsRef.current.readyState > WebSocket.OPEN) openSocket();
    await load();
    setRefreshing(false);
  };

  const restaurants = data.detectedRestaurants;

  // ── Terminal empty states — the loader must STOP when the scan does ────────
  if (restaurants.length === 0 && scanState !== "scanning") {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {scanState === "failed" ? "Scan Failed" : "No Restaurants Found"}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {scanState === "failed"
              ? scanError ?? "Something went wrong while scanning your mailbox."
              : "We scanned your connected mailbox but found no Zomato or Swiggy payout emails. This usually means payouts arrive in a different inbox, or none have arrived yet."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={rescan} disabled={refreshing}>
            <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Rescan
          </Button>
        </div>
        <div className="max-w-xl mx-auto text-left">
          <AddEmailCard onConnected={() => void rescan()} />
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="space-y-6 text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scanning Your Payout Emails</h2>
          <p className="text-muted-foreground mt-2">
            We're scanning your connected mailbox for Zomato & Swiggy payout statements.
            Restaurant IDs appear here as they're found — usually within a minute.
          </p>
        </div>
      </div>
    );
  }

  const zomatoCount = restaurants.filter((r) => r.platform === "zomato").length;
  const swiggyCount = restaurants.filter((r) => r.platform === "swiggy").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-mint flex items-center justify-center shrink-0">
            {scanState === "scanning"
              ? <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
              : <Check className="h-5 w-5 text-primary-foreground" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {scanState === "scanning" ? "Scanning…" : "Restaurants Detected"}
            </h2>
            <p className="text-muted-foreground mt-0.5">
              {restaurants.length} platform ID{restaurants.length !== 1 ? "s" : ""} found
              {scanState === "scanning" ? " so far — scan in progress." : " in your payout emails."}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={rescan} disabled={refreshing || scanState === "scanning"} className="text-xs shrink-0">
          <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Rescan
        </Button>
      </div>

      {/* Platform summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
            <span className="text-red-400 font-bold text-sm">Z</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{zomatoCount}</div>
            <div className="text-xs text-muted-foreground">Zomato IDs found</div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
            <span className="text-orange-400 font-bold text-sm">S</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{swiggyCount}</div>
            <div className="text-xs text-muted-foreground">Swiggy IDs found</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-3 px-3 font-medium">Platform</th>
              <th className="text-left py-3 px-3 font-medium">Restaurant ID</th>
              <th className="text-left py-3 px-3 font-medium">Name (from email)</th>
              <th className="text-left py-3 px-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.platform === "zomato" ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                  }`}>
                    {r.platform === "zomato" ? "Zomato" : "Swiggy"}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-foreground">{r.platformId}</td>
                <td className="py-3 px-3 text-foreground">{r.name}</td>
                <td className="py-3 px-3">
                  {r.mappedOutletName ? (
                    <span className="text-xs text-primary">Mapped → {r.mappedOutletName}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">New</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddEmailCard onConnected={() => void rescan()} />

      <p className="text-sm text-muted-foreground">
        Next: Map these IDs to your outlets for accurate reporting.
      </p>
    </div>
  );
}

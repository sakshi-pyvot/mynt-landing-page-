import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { openOnboardingSocket, type OnboardingWsFrame } from "@/lib/onboardingSocket";
import { handoffToApp } from "@/lib/auth";
import { APP_URL } from "@/lib/appUrl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Clock, Loader2, AlertTriangle,
  Mail, MessageSquare, Bell, ArrowRight, RefreshCw,
  BarChart3, IndianRupee, Megaphone, Receipt, Tag, RotateCcw,
} from "lucide-react";

// Real per-run ingestion telemetry (companion fix in mynt-user-center adds
// `activated` to GET /me/onboarding/ingestion alongside the existing
// `state`/`runs` fields — see SCRUM ticket for the DIP-accepted-activation
// signal this page now drives off of instead of a fake, always-advancing
// task list).
/** Per-month tallies, keyed "YYYY-MM" — same shape on the WS frame and the poll row. */
interface MonthProgress {
  expected: number;
  parsed: number;
  skipped: number;
  errored: number;
  sidelined: number;
  orders: number;
}

interface IngestionRunRow {
  id: number;
  status: "running" | "succeeded" | "partial" | "failed" | "skipped";
  filesFetched: number;
  filesParsed: number;
  filesSkipped: number;
  filesErrored: number;
  filesSidelined: number;
  filesExpected: number;
  ordersInserted: number;
  ordersUpdated: number;
  uniqueResIds: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  /** Live per-month breakdown for this run, as of the last poll. */
  monthProgress?: Record<string, MonthProgress>;
  /** "YYYY-MM" the run is actively working through, or null between months. */
  currentMonth?: string | null;
}

/** `ingest.progress` payload's `counters` — same fields as the run row's `files*`, unprefixed. */
interface IngestCounters {
  fetched: number;
  parsed: number;
  skipped: number;
  errored: number;
  sidelined: number;
  expected: number;
  orders: number;
}

/** Gold-aggregation progress (DIP → UC passes `state` through verbatim). */
interface AggregationSummary {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  /** Every job finished cleanly AND there was at least one. Never true at zero jobs. */
  done: boolean;
}

interface IngestionResponse {
  state?: { isActive?: boolean; aggregation?: AggregationSummary };
  runs?: { runs?: IngestionRunRow[] };
  activated?: boolean;
}

type UiState = "provisioning" | "scanning" | "processing" | "aggregating" | "ready" | "failed";

const PLATFORM_LABELS: Record<string, string> = { zomato: "Zomato", swiggy: "Swiggy" };

function getEstimatedTime(outlets: number): string {
  if (outlets <= 5) return "~5 min";
  if (outlets <= 10) return "~10–15 min";
  if (outlets <= 25) return "~25–40 min";
  return "~1–2 hrs";
}

/**
 * Share of the run's files that have reached a terminal outcome. Every outcome
 * counts, not just `parsed` — a month whose files all skipped/errored is as
 * finished as one fully parsed.
 */
export function ingestPct(
  counters: Pick<IngestCounters, "parsed" | "skipped" | "errored" | "sidelined" | "expected"> | null,
): number {
  if (!counters || counters.expected <= 0) return 0;
  const settled = counters.parsed + counters.skipped + counters.errored + counters.sidelined;
  return Math.min(100, Math.round((settled / counters.expected) * 100));
}

/**
 * How far along the dashboards are, 0-100, for the availability cards.
 *
 * Ingest is the long pole so it owns 60 points, but the GOLD layer is what
 * makes a dashboard usable, so it owns the last 40 — otherwise every card would
 * read Ready throughout `aggregating`, the exact state this page exists to hold
 * customers back in. `ready` is the only truthful 100: raw ingest percentage
 * reads 0 once a finished run reports `expected: 0`.
 *
 * Not a per-dashboard capability claim — there is no per-dashboard signal in the
 * API. It is a staggered reveal of one real overall progress number.
 */
export function dashboardReadiness(opts: {
  uiState: UiState;
  ingestPct: number;
  ingestionDone: boolean;
  aggregation: { total: number; completed: number } | null;
}): number {
  const { uiState, ingestPct: ingest, ingestionDone, aggregation } = opts;
  if (uiState === "ready") return 100;
  if (uiState === "provisioning" || uiState === "scanning") return 0;
  const ingestScore = ingestionDone ? 100 : ingest;
  // total === 0 is "no jobs yet", never "done" — same rule as `aggregation.done`.
  const aggScore = aggregation && aggregation.total > 0
    ? (aggregation.completed / aggregation.total) * 100
    : 0;
  return Math.min(100, Math.round(0.6 * ingestScore + 0.4 * aggScore));
}

/**
 * The six data dashboards the customer app actually ships, in its own sidebar
 * order, with its labels and icons — this screen is their first sight of the
 * product, so the two should not look like different apps. Kept in step with
 * `InsightPage` and the routes in mynt-cfd-frontend.
 *
 * Thresholds are a staggered reveal of one real overall number, not six
 * separate signals: there is no per-dashboard progress in the API today.
 */
const DASHBOARD_CARDS = [
  { id: "dashboard", name: "Dashboard", Icon: BarChart3, threshold: 20 },
  { id: "earnings", name: "Earnings", Icon: IndianRupee, threshold: 35 },
  { id: "advertisements", name: "Advertisements", Icon: Megaphone, threshold: 50 },
  { id: "charges", name: "Charges", Icon: Receipt, threshold: 65 },
  { id: "discounts", name: "Discounts", Icon: Tag, threshold: 80 },
  { id: "refunds", name: "Refunds", Icon: RotateCcw, threshold: 95 },
] as const;

export type MonthRowStatus = "completed" | "in_progress" | "pending";

/**
 * A month's state for the progress table. `settled` counts every terminal
 * outcome, so a month of nothing but skipped or errored files still completes —
 * the alternative leaves it stuck below 100% forever with no work left to do.
 * The month the run is currently on shows as in progress even before its first
 * file settles, so the table always has one row that visibly moves.
 */
export function deriveRowStatus(opts: {
  settled: number;
  expected: number;
  isCurrent: boolean;
}): MonthRowStatus {
  const { settled, expected, isCurrent } = opts;
  if (expected > 0 && settled >= expected) return "completed";
  if (isCurrent || settled > 0) return "in_progress";
  return "pending";
}

/** "2026-08" → "August 2026". Falls back to the raw key if it doesn't parse. */
function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  if (!year || !month) return ym;
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

// The "we'll notify you" card is built but not connected: nothing sends an
// email, a WhatsApp message or a push when the dashboards finish, and the three
// toggles only move local state. Promising a customer a notification we never
// send is worse than staying quiet, so the card is hidden until the backend
// behind it exists. Everything below stays wired and typechecked — flip this to
// true once notifications actually send.
const NOTIFY_CHANNELS_ENABLED = false;

// Where a finished customer lands — the real customer dashboard app. Reuse
// the shared, trailing-slash-normalized APP_URL (see src/lib/appUrl.ts)
// instead of reading VITE_DASHBOARD_URL raw here: an un-stripped trailing
// slash produced `${dest}/?handoff=` (a `//` path) in handoffToApp(), which
// the F7 `/` route doesn't match — so it fell through to the catch-all and
// the handoff code was never redeemed.
const DASHBOARD_URL = APP_URL || "/";

export default function DataProcessing() {
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [notifyPush, setNotifyPush] = useState(true);

  const [outlets, setOutlets] = useState(0);
  const [historicMonths, setHistoricMonths] = useState<number | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());

  const [activated, setActivated] = useState(false);
  const [runs, setRuns] = useState<IngestionRunRow[]>([]);
  const [aggregation, setAggregation] = useState<AggregationSummary | null>(null);

  // Live per-run telemetry from the onboarding WS (ingest.progress). The 6s
  // REST poll below seeds/reconciles the same three pieces of state so a
  // reload mid-ingest — or a socket that never connects — still shows
  // progress, just at REST cadence instead of streaming.
  const [liveCounters, setLiveCounters] = useState<IngestCounters | null>(null);
  const [monthProgress, setMonthProgress] = useState<Record<string, MonthProgress>>({});
  const [currentMonth, setCurrentMonth] = useState<string | null>(null);
  // Set on the first ingest.progress WS frame. Once true, the WS owns
  // liveCounters/monthProgress/currentMonth and the REST poll stops writing
  // them (it only seeds pre-WS / WS-less), so a stale 6s poll can't jump
  // progress backward after a fresher WS frame.
  const wsActiveRef = useRef(false);

  useEffect(() => {
    api.get<{ subscription: { outletCount: number; historicDataMonths: number } | null }>("/me/onboarding")
      .then((s) => {
        if (s.subscription) {
          setOutlets(s.subscription.outletCount);
          setHistoricMonths(s.subscription.historicDataMonths || null);
        }
      })
      .catch(() => {});
  }, []);

  // TODO: if this endpoint's shape ever makes platform derivation awkward,
  // it's fine to fall back to a static label — this is a nice-to-have.
  useEffect(() => {
    api.get<{ platformIds?: { platform: string }[] }[]>("/me/onboarding/outlets")
      .then((rows) => {
        const platforms = new Set<string>();
        rows.forEach((row) => row.platformIds?.forEach((p) => platforms.add(p.platform)));
        setConnectedPlatforms(platforms);
      })
      .catch(() => {});
  }, []);

  const poll = useCallback(async () => {
    try {
      const r = await api.get<IngestionResponse>("/me/onboarding/ingestion");
      setActivated(!!r.activated);
      const rows = r.runs?.runs ?? [];
      setRuns(rows);
      setAggregation(r.state?.aggregation ?? null);

      // Reconcile the live-progress panel off the same run row so it seeds
      // immediately on a reload mid-ingest, and stays in sync even if the
      // WS never delivers a frame (or drops between them). Once the WS has
      // started streaming, it owns this state — the poll only SEEDS it
      // (bootstrap / pre-WS / WS-less) so a stale 6s snapshot can't regress
      // progress a fresher WS frame already advanced.
      if (wsActiveRef.current) return;
      const activeRow = rows.find((row) => row.status === "running") ?? rows[0];
      if (activeRow?.monthProgress) setMonthProgress(activeRow.monthProgress);
      if (activeRow && activeRow.currentMonth !== undefined) setCurrentMonth(activeRow.currentMonth);
      // Also seed the overall bar's counters from the same row — this is the
      // only source of `liveCounters` when the WS never connects (e.g. a
      // blocked proxy), otherwise the per-month bars render but the overall
      // bar never appears.
      if (activeRow) {
        setLiveCounters({
          fetched: activeRow.filesFetched,
          parsed: activeRow.filesParsed,
          skipped: activeRow.filesSkipped,
          errored: activeRow.filesErrored,
          sidelined: activeRow.filesSidelined,
          expected: activeRow.filesExpected,
          orders: activeRow.ordersInserted,
        });
      }
    } catch {
      /* pipeline warming up — keep polling */
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 6000);
    return () => clearInterval(interval);
  }, [poll]);

  // Secondary, faster feed for the same telemetry: the customer onboarding WS
  // relay (browser → customer-backend → UC → DIP) that RestaurantDetection
  // already opens for its discover.* frames — this page listens on the same
  // connection mechanics for ingest.* frames instead. If the socket can't
  // connect the REST poll above still covers this page on its own.
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = openOnboardingSocket({
        onMessage: (msg: OnboardingWsFrame) => {
          if (msg.type !== "ingest.progress") return;
          const payload = msg.payload as
            | {
                month?: string | null;
                counters?: IngestCounters;
                month_progress?: Record<string, MonthProgress>;
              }
            | undefined;
          if (!payload) return;
          // Once the WS is delivering frames, it owns this state — stop
          // letting the 6s REST poll overwrite it (Finding 4).
          wsActiveRef.current = true;
          if (payload.counters) setLiveCounters(payload.counters);
          if (payload.month_progress) setMonthProgress(payload.month_progress);
          // Only overwrite the current-month label when this frame actually
          // reports one — a `month: null` frame means "no active month right
          // now", not "forget the last one we knew about" (Finding 3).
          if (payload.month != null) setCurrentMonth(payload.month);
        },
        // If the socket drops mid-run, stop deferring to it — let the 6s REST
        // poll resume seeding progress (reconnect edge: WS connects then dies).
        onClose: () => { wsActiveRef.current = false; },
        onError: () => { wsActiveRef.current = false; },
      });
    } catch {
      /* no socket — the REST poll still covers this page */
    }
    return () => ws?.close();
  }, []);

  // Derive real state from the runs the backend actually recorded — a run
  // finalizing as "succeeded" does NOT by itself mean real data landed (a
  // scan that finds zero matching emails still succeeds with 0 inserts), so
  // "ready" is gated on actual inserted orders, never on run status alone.
  const anyRunning = runs.some((r) => r.status === "running");
  const hasFailedRuns = runs.some((r) => r.status === "failed");
  // A live account's scheduler opens a no-op `skipped` poll run every minute:
  // momentarily "running" but fetching nothing. Only a run that is actually
  // fetching (files_expected/fetched > 0) counts as ingest still in flight — a
  // just-opened real run reads as no-op for the second before its scan sets
  // files_expected. Gating readiness on plain "any run running" never settles
  // (the poll run flips it every cycle).
  const ingestInFlight = runs.some(
    (r) => r.status === "running" && (r.filesExpected > 0 || r.filesFetched > 0),
  );
  const totalOrdersInserted = runs
    .filter((r) => r.status === "succeeded" || r.status === "partial")
    .reduce((sum, r) => sum + r.ordersInserted, 0);
  const totalFilesFetched = runs.reduce((sum, r) => sum + r.filesFetched, 0);
  const totalFilesParsed = runs.reduce((sum, r) => sum + r.filesParsed, 0);

  // The dashboard reads the GOLD layer, not bronze — orders landing in bronze
  // does not mean there is anything to look at yet. So "ready" (and the only
  // Go-to-Dashboard link) waits for aggregation as well as ingestion.
  // `aggregation.done` is false while zero jobs exist, which is what keeps this
  // closed during the window between "ingestion finished" and "aggregator
  // picked the run up" — otherwise we'd send customers to an empty dashboard.
  // It also waits for the ingest RUN to finish, not merely for the first orders
  // to land: `aggregation.done` only means "nothing pending right now",
  // trivially true between batches of a long backfill, so orders>0 alone
  // declared 13 months of history ready ~1% in — swapping the progress table
  // out for the ready card while the rest of the history was still arriving.
  const ingestionDone = totalOrdersInserted > 0 && !ingestInFlight;
  const aggregationDone = aggregation?.done === true;

  const uiState: UiState =
    ingestionDone && aggregationDone ? "ready"
    : !activated ? "provisioning"
    : runs.length === 0 ? "scanning"
    : hasFailedRuns && !ingestInFlight && !ingestionDone ? "failed"
    : ingestionDone ? "aggregating"
    : "processing";

  const lastFailedRun = [...runs]
    .filter((r) => r.status === "failed")
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

  const isReady = uiState === "ready";

  // Unlock progress must never go backwards. Three things here legitimately dip:
  // liveCounters swaps to a fresh run reporting expected=0, ingestInFlight
  // re-arms on every no-op poll run, and aggregation.total grows mid-backfill.
  // Any of them would re-lock a card the customer already watched unlock, which
  // reads as data being taken away. Math.max is idempotent, so re-running it on
  // StrictMode's double render is harmless.
  const readinessRef = useRef(0);
  readinessRef.current = Math.max(
    readinessRef.current,
    dashboardReadiness({
      uiState,
      ingestPct: ingestPct(liveCounters),
      ingestionDone,
      aggregation,
    }),
  );
  const readinessPct = readinessRef.current;

  const platformsLabel = connectedPlatforms.size
    ? Array.from(connectedPlatforms).map((p) => PLATFORM_LABELS[p] ?? p).join(" + ")
    : "—";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-5xl py-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gradient-mint">mynt</span>
            {/* Only route to the dashboard once the gold layer actually has data
                in it — before that the dashboard renders empty and reads as broken. */}
            {isReady && (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => void handoffToApp(DASHBOARD_URL)}>
                Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-5xl py-8 px-4 space-y-8">
        {/* Top Section — Overall Status */}
        <div>
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            <CardHeader className="relative pb-2">
              <CardTitle className="text-xl font-bold text-foreground">
                {isReady ? "🎉 Your dashboards are ready!" : "Setting up your dashboards..."}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isReady
                  ? "Real payout data has landed — your dashboards reflect it now."
                  : "We are fetching and processing your historic payout data."}
              </p>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <InfoChip label="Historic Period" value={historicMonths ? `Last ${historicMonths} Months` : "—"} />
                <InfoChip label="Outlets" value={String(outlets)} />
                <InfoChip label="Platforms" value={platformsLabel} />
                <InfoChip label="Orders Found" value={String(totalOrdersInserted)} />
                <InfoChip label="Estimate" value={getEstimatedTime(outlets)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave page notice — see NOTIFY_CHANNELS_ENABLED */}
        {NOTIFY_CHANNELS_ENABLED && !isReady && (
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Bell className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">You can leave this page</p>
                  <p className="text-xs text-muted-foreground">We'll notify you when your dashboards are ready.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotifyToggle icon={<Mail className="h-3.5 w-3.5" />} label="Email" active={notifyEmail} toggle={() => setNotifyEmail(!notifyEmail)} />
                <NotifyToggle icon={<MessageSquare className="h-3.5 w-3.5" />} label="WhatsApp" active={notifyWhatsApp} toggle={() => setNotifyWhatsApp(!notifyWhatsApp)} />
                <NotifyToggle icon={<Bell className="h-3.5 w-3.5" />} label="Push" active={notifyPush} toggle={() => setNotifyPush(!notifyPush)} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real ingestion status */}
        <StatusPanel
          uiState={uiState}
          totalFilesFetched={totalFilesFetched}
          totalFilesParsed={totalFilesParsed}
          totalOrdersInserted={totalOrdersInserted}
          anyRunning={anyRunning}
          lastFailedRun={lastFailedRun}
          aggregation={aggregation}
          onRetry={poll}
        />

        {/* Live per-month ingestion progress (WS-driven, REST-seeded) */}
        {!isReady && (
          <IngestionProgressPanel
            counters={liveCounters}
            monthProgress={monthProgress}
            currentMonth={currentMonth}
          />
        )}

        {/* Which dashboards are usable yet */}
        {(uiState === "processing" || uiState === "aggregating" || isReady) && (
          <DashboardAvailability pct={readinessPct} />
        )}

        {/* All done CTA */}
        {isReady && (
          <div className="text-center py-6">
            <Button onClick={() => void handoffToApp(DASHBOARD_URL)} className="gradient-mint text-primary-foreground hover:opacity-90 px-8 h-12 text-base">
              Go to Dashboard <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPanel({
  uiState, totalFilesFetched, totalFilesParsed, totalOrdersInserted, anyRunning, lastFailedRun, aggregation, onRetry,
}: {
  uiState: UiState;
  totalFilesFetched: number;
  totalFilesParsed: number;
  totalOrdersInserted: number;
  anyRunning: boolean;
  lastFailedRun?: IngestionRunRow;
  aggregation: AggregationSummary | null;
  onRetry: () => void;
}) {
  if (uiState === "aggregating") {
    // Ingestion has landed; the gold layer is still being built. Show the real
    // job counts rather than an indefinite spinner — and say so plainly when
    // aggregation jobs have failed, since that will never clear on its own.
    const stalled = (aggregation?.failed ?? 0) > 0;
    return (
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm" data-testid="status-aggregating">
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          {stalled ? <AlertTriangle className="h-6 w-6 text-amber-400" /> : <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          <p className="text-sm font-medium text-foreground">
            {stalled
              ? "Some of your data could not be summarised"
              : "Building your dashboards from the data we found…"}
          </p>
          <p className="text-xs text-muted-foreground">
            {totalOrdersInserted.toLocaleString()} orders processed
            {aggregation && aggregation.total > 0
              ? ` · ${aggregation.completed}/${aggregation.total} summaries built`
              : " · waiting for the summary step to start"}
          </p>
          {stalled && (
            <p className="text-xs text-muted-foreground">
              Reach us at <a href="mailto:support@mynt.in" className="underline">support@mynt.in</a> and we'll finish this off.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (uiState === "provisioning") {
    return (
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm" data-testid="status-provisioning">
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Getting your data pipeline ready…</p>
          <p className="text-xs text-muted-foreground">This usually only takes a moment.</p>
        </CardContent>
      </Card>
    );
  }

  if (uiState === "scanning") {
    return (
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm" data-testid="status-scanning">
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Scanning your connected mailbox for payout statements…</p>
          <p className="text-xs text-muted-foreground">We'll start parsing as soon as we find your statements.</p>
        </CardContent>
      </Card>
    );
  }

  if (uiState === "failed") {
    return (
      <Card className="border-red-500/20 bg-red-500/5" data-testid="status-failed">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            We're having trouble processing your payout emails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {lastFailedRun?.errorMessage || "An unexpected error interrupted the last scan."}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try again
            </Button>
            <p className="text-xs text-muted-foreground">
              Still stuck? Reach us at <a href="mailto:support@mynt.in" className="underline">support@mynt.in</a>.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uiState === "ready") {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5" data-testid="status-ready">
        <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <p className="text-base font-semibold text-foreground">Your dashboards are ready</p>
          <p className="text-sm text-muted-foreground">{totalOrdersInserted.toLocaleString()} orders processed so far.</p>
        </CardContent>
      </Card>
    );
  }

  // "processing": at least one real run exists but none has landed data yet.
  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm" data-testid="status-processing">
      <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
        {anyRunning ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <Clock className="h-6 w-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium text-foreground">
          {anyRunning ? "Processing your payout statements…" : "Waiting for the next scan…"}
        </p>
        <p className="text-xs text-muted-foreground">
          {totalFilesFetched} files scanned, {totalFilesParsed} parsed so far.
        </p>
      </CardContent>
    </Card>
  );
}

/** Live per-run telemetry: overall bar, per-month bars, "currently ingesting" label. */
function IngestionProgressPanel({
  counters, monthProgress, currentMonth,
}: {
  counters: IngestCounters | null;
  monthProgress: Record<string, MonthProgress>;
  currentMonth: string | null;
}) {
  const months = Object.keys(monthProgress).sort();
  if (!counters && months.length === 0) return null;

  const overallPct = ingestPct(counters);

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm" data-testid="ingestion-progress">
      <CardContent className="py-6 space-y-4">
        {currentMonth && (
          <p className="text-sm font-medium text-foreground" data-testid="current-month-label">
            Currently ingesting: {formatMonthLabel(currentMonth)}
          </p>
        )}

        {counters && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Overall progress</span>
              <span>{overallPct}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={overallPct}
              aria-valuemin={0}
              aria-valuemax={100}
              data-testid="overall-progress-bar"
              className="h-2 w-full rounded-full bg-muted/40 overflow-hidden"
            >
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        )}

        {months.length > 0 && (
          <Table data-testid="month-progress-list">
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Month
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Status
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium text-right min-w-[160px]">
                  Progress
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((m) => {
                const mp = monthProgress[m];
                // Numerator counts every terminal outcome, not just `parsed` —
                // a month whose files are all skipped/errored/sidelined is
                // just as "done" as one that's fully parsed, and should not
                // sit at 0% forever while the overall bar reads 100%.
                const settled = mp.parsed + mp.skipped + mp.errored + mp.sidelined;
                // Guard ≤100%: never let a denominator smaller than what's
                // actually settled make the bar overshoot.
                const denom = Math.max(mp.expected, settled, 1);
                const pct = Math.min(100, Math.round((settled / denom) * 100));
                const status = deriveRowStatus({
                  settled, expected: mp.expected, isCurrent: m === currentMonth,
                });
                return (
                  <TableRow
                    key={m}
                    data-testid={`month-progress-${m}`}
                    data-status={status}
                    className="border-border/30 hover:bg-muted/20"
                  >
                    <TableCell className="font-medium text-foreground py-3">
                      {formatMonthLabel(m)}
                    </TableCell>
                    <TableCell className="py-3">
                      <MonthStatusBadge status={status} />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-end gap-3">
                        <div
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          data-testid={`month-progress-bar-${m}`}
                          className="h-1.5 w-24 sm:w-32 rounded-full bg-muted/30 overflow-hidden"
                        >
                          <div
                            className={`h-full rounded-full transition-all ${
                              status === "completed" ? "bg-emerald-400"
                                : status === "in_progress" ? "bg-sky-400"
                                  : "bg-muted-foreground/40"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                          {settled}/{Math.max(mp.expected, settled)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/** Per-month status pill for the progress table. */
function MonthStatusBadge({ status }: { status: MonthRowStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-sky-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

/**
 * Which dashboards are usable yet. Purely informational: no links, no buttons —
 * the single Go-to-Dashboard handoff stays the one way through, so this section
 * cannot send anyone to a view that has no data behind it.
 */
function DashboardAvailability({ pct }: { pct: number }) {
  const cards = DASHBOARD_CARDS.map((card) => ({ ...card, ready: pct >= card.threshold }));
  // Only the next card in line spins; the rest simply wait.
  const activeIndex = cards.findIndex((card) => !card.ready);

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm" data-testid="dashboard-availability">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">Dashboard Availability</CardTitle>
        <p className="text-xs text-muted-foreground">
          Dashboards unlock as data is processed — no need to wait for everything.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => {
          const state = card.ready ? "ready" : i === activeIndex ? "active" : "waiting";
          const { Icon } = card;
          return (
            <div
              key={card.id}
              data-testid={`dash-card-${card.id}`}
              data-state={state}
              className={`rounded-xl border p-4 ${
                card.ready ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 bg-muted/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`p-2 rounded-lg ${
                    card.ready ? "bg-emerald-500/10 text-emerald-400" : "bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                {card.ready ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    Ready
                  </span>
                ) : state === "active" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" aria-hidden />
                ) : null}
              </div>
              <p className={`text-sm font-medium mt-3 ${card.ready ? "text-foreground" : "text-muted-foreground"}`}>
                {card.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {card.ready ? "Live with your data" : state === "active" ? "Building this view…" : "Waiting for data"}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg px-3 py-2 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function NotifyToggle({ icon, label, active, toggle }: { icon: React.ReactNode; label: string; active: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
        active
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-muted/20 border-border/50 text-muted-foreground hover:border-border"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

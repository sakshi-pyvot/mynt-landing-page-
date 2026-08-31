import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, ExternalLink, Loader2, Shield, Lock } from "lucide-react";
import {
  FIXED_DURATION_MONTHS,
  FIXED_HISTORIC_MONTHS,
  FIXED_PLAN,
  type OnboardingPayment,
  type OnboardingSubscription,
  useOnboarding,
} from "@/contexts/OnboardingContext";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isUsablePaymentLink } from "@/lib/paymentLinks";
import { openOnboardingSocket, type OnboardingWsFrame } from "@/lib/onboardingSocket";
import { GST_STATE_CODES, isValidGstinFormat, verifyGstin, type GstinDetails } from "@/lib/gstin";

// Real payment (SCRUM-72 Phase 4): UC creates the server-priced subscription;
// the customer makes a one-time payment on Razorpay's hosted page (no card/UPI
// fields ever render here) and this screen polls until the webhook flips the
// application stage to paid.

// POST /me/onboarding/subscription/check-payment is rate limited to 5 calls
// per 60s per account. The gap floors every automatic trigger; the interval
// sits ABOVE it deliberately, so a focus event can still win a slot instead
// of the ticker eating them all. Worst case: 4 automatic + 1 manual = 5.
const RECHECK_MIN_GAP_MS = 15_000;
const RECHECK_INTERVAL_MS = 20_000;

// Debounce on the awaiting-payment identity save. Long enough that typing an
// address is one PATCH and not thirty — every PATCH carrying a GSTIN costs UC
// a paid register lookup and re-stamps gstin_verified_at — and far short of
// the time it takes to finish paying in the Razorpay tab, which is the
// deadline that matters: the licence invoice is cut from what UC holds when
// the payment settles.
const IDENTITY_COMMIT_DEBOUNCE_MS = 800;

interface Preview {
  gross: number;
  discount: number;
  discountPct: number;
  gstAmount: number;
  totalAmount: number;
  durationMonths: number;
}

interface CreatedBasePaymentLink {
  subscriptionId: string;
  paymentLinkId: string;
  shortUrl: string;
  amount: string;
  outletCount: number;
}

interface RetainedBasePaymentLink {
  accountId: number | null;
  paymentLinkId: string | null;
  subscriptionId: string | null;
  rowSubscriptionId: string;
  shortUrl: string;
  status: string | null;
  expiresAt: string | null;
  amount: string;
  outletCount: number;
  plan: string;
  durationMonths: number;
  historicDataMonths: number;
  subscriptionStatus: string;
}

type CancellationState =
  | "pending"
  | "failed"
  | "checking_settlement"
  | "cancelled";

interface CancellationOperation {
  accountId: number | null;
  linkId: string;
  state: CancellationState;
  promise: Promise<void>;
}

interface BaseCleanupTarget {
  accountId: number | null;
  linkId: string;
  subscriptionId: string;
  outletCount: number;
}

interface BaseStartOperation {
  accountId: number | null;
  purchaseKey: string;
  generation: number;
  viewToken: number;
  state: "creating" | "retiring" | "cleanup_failed";
  cleanupTarget?: BaseCleanupTarget;
  promise: Promise<void>;
}

const paymentLinkOperationKey = (
  accountId: number | null,
  linkId: string,
) => `${accountId ?? "unknown"}:${linkId}`;

const basePurchaseKey = (
  accountId: number | null,
  outletCount: number,
) =>
  [
    accountId ?? "unknown",
    FIXED_PLAN,
    FIXED_DURATION_MONTHS,
    FIXED_HISTORIC_MONTHS,
    outletCount,
  ].join(":");

/** "a", "a and b", "a, b and c" — reads as a sentence in the blocked copy. */
const joinReasons = (reasons: string[]): string =>
  reasons.length <= 1
    ? reasons[0] ?? ""
    : `${reasons.slice(0, -1).join(", ")} and ${reasons[reasons.length - 1]}`;

const retainedFromServer = (
  accountId: number | null,
  payment: OnboardingPayment | null,
  subscription: OnboardingSubscription | null,
): RetainedBasePaymentLink | null => {
  if (!payment || !subscription || !isUsablePaymentLink(payment)) return null;
  return {
    accountId,
    paymentLinkId: payment.paymentLinkId ?? null,
    subscriptionId: payment.subscriptionId ?? null,
    rowSubscriptionId: subscription.id,
    shortUrl: payment.shortUrl,
    status: payment.status,
    expiresAt: payment.expiresAt ?? null,
    amount: subscription.totalAmount,
    outletCount: subscription.outletCount,
    plan: subscription.plan,
    durationMonths: subscription.durationMonths,
    historicDataMonths: subscription.historicDataMonths,
    subscriptionStatus: subscription.status,
  };
};

export default function Payment() {
  const { accountId, data, stage, payment, subscription, refresh, updateData, persist } = useOnboarding();
  const [preview, setPreview] = useState<Preview | null>(null);
  // GST tax identity (SCRUM-72 task 8b): GSTIN is optional, but place of
  // supply is not — every customer needs a billing state on file so the
  // invoice can pick CGST+SGST (in-state) vs IGST (out-of-state) instead of
  // silently falling back to our own West Bengal registration.
  const [gstinVerifying, setGstinVerifying] = useState(false);
  const [gstinError, setGstinError] = useState<string | null>(null);
  const [pendingGstinDetails, setPendingGstinDetails] = useState<GstinDetails | null>(null);
  const gstinDialogOpen = pendingGstinDetails !== null;
  const [retainedLink, setRetainedLink] = useState<RetainedBasePaymentLink | null>(
    () => retainedFromServer(accountId, payment, subscription),
  );
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [, setOperationVersion] = useState(0);
  // Shared by the automatic reconcile and the manual button so the two paths
  // can never double-fire against the rate limiter.
  const lastCheckAtRef = useRef(0);
  const checkInFlightRef = useRef(false);
  const retainedRef = useRef(retainedLink);
  const mountedRef = useRef(true);
  const cancellationOperationsRef =
    useRef(new Map<string, CancellationOperation>());
  const startOperationsRef =
    useRef(new Map<string, BaseStartOperation>());
  const ownerScopeRef = useRef(accountId);
  const accountIdRef = useRef(accountId);
  // The context re-creates persist() every render; effects read it through
  // this so they don't have to re-subscribe (and re-arm their timers) on it.
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const purchaseKey = basePurchaseKey(accountId, data.numberOfRestaurants);
  const purchaseKeyRef = useRef(purchaseKey);
  const committedViewRef = useRef({ key: purchaseKey, token: 0 });
  const nextStartGenerationRef = useRef(0);

  retainedRef.current = retainedLink;
  accountIdRef.current = accountId;
  purchaseKeyRef.current = purchaseKey;

  useLayoutEffect(() => {
    if (committedViewRef.current.key !== purchaseKey) {
      committedViewRef.current = {
        key: purchaseKey,
        token: committedViewRef.current.token + 1,
      };
    }
  }, [purchaseKey]);

  const bumpOperations = useCallback(() => {
    if (mountedRef.current) setOperationVersion((version) => version + 1);
  }, []);

  const isPaid = stage !== "draft"; // stage order: paid and beyond

  // Runtime-guarded (TS here is non-strict): older/mocked contexts may not
  // carry these fields at all, so treat missing as empty rather than crash.
  const gstinUnconfirmed = Boolean(data.gstin) && !data.gstinConfirmed;
  const billingAddressMissing = !String(data.billingAddress ?? "").trim();
  const billingStateMissing = !data.billingStateCode;
  const billingIncomplete = billingAddressMissing || billingStateMissing;
  const identityIncomplete = gstinUnconfirmed || billingIncomplete;

  // A greyed-out Pay button with no copy is a dead end: the customer cannot
  // tell an unverified GSTIN from a register outage, and the spec's "continue
  // without a GSTIN" path is never offered. Every other disabled branch in
  // this panel explains itself; this one has to as well.
  const payBlockedReasons = [
    gstinUnconfirmed && "verify the GSTIN above (or continue without one)",
    billingAddressMissing && "enter your billing address",
    billingStateMissing && "select your billing state",
  ].filter((reason): reason is string => Boolean(reason));

  const handleVerifyGstin = async () => {
    setGstinError(null);
    setGstinVerifying(true);
    try {
      const result = await verifyGstin(data.gstin ?? "");
      if (result.ok === false) {
        setGstinError(result.reason);
        return;
      }
      setPendingGstinDetails(result.details);
    } finally {
      setGstinVerifying(false);
    }
  };

  const closeGstinDialog = () => setPendingGstinDetails(null);

  const confirmGstinDetails = () => {
    if (!pendingGstinDetails) return;
    updateData({
      gstin: pendingGstinDetails.gstin,
      gstinConfirmed: true,
      // ONE name on screen, TWO fields underneath it, both set to the
      // register's own name for this registration.
      //
      // companyName is the name the customer reads back here and the account
      // is known by. Verifying a GSTIN is the customer asserting *this is who
      // we are*, so the register's answer replaces what they typed on page 0
      // — the box then locks, because the register is the authority on it.
      //
      // legalEntityName carries the same value rather than being dropped:
      // UC's invoiceService renders `account.legalEntityName ||
      // account.name`, and UC's promotion path reads legalEntityName off this
      // blob. Stop sending it and tax invoices silently change. Keeping the
      // two in step is what makes the invoice print what the one box shows.
      //
      // Refusal to blank, per field and independently — the same rule the
      // address below gets. legalName is typed non-null, so "" is the
      // realistic nothing-case, and writing it through would empty the only
      // name box on the screen while the dialog claimed the details had been
      // applied. Each field falls back to its OWN stored value so an empty
      // register answer cannot collapse a divergent pair.
      companyName:
        pendingGstinDetails.legalName || String(data.companyName ?? ""),
      legalEntityName:
        pendingGstinDetails.legalName || String(data.legalEntityName ?? ""),
      // The register may carry no address at all (UC sends null when
      // `pradr.addr` is missing). Writing that null through blanked the
      // address box while the dialog claimed the details had been applied,
      // and Pay then stayed disabled with nothing to act on. Keep whatever
      // the customer already typed; never store a non-string.
      billingAddress:
        pendingGstinDetails.address ?? String(data.billingAddress ?? ""),
      billingStateCode: pendingGstinDetails.stateCode,
    });
    setPendingGstinDetails(null);
  };

  /**
   * The B2C escape hatch. A GSTIN that will not verify — a typo, a cancelled
   * registration, or a register outage — must not trap the customer on this
   * step: clearing it drops them to B2C and unblocks Pay. The registered name
   * for tax purposes goes with it; it belongs to a GSTIN that is no longer
   * claimed.
   *
   * The COMPANY NAME stays. It is the account's own name, it is mandatory on
   * wizard page 0, and blanking the box a customer is billed under because
   * they are backing out of a GSTIN would be hostile — the more so now that
   * it is the only name field on this screen. It simply unlocks, so they can
   * correct it in place. `account.legalEntityName || account.name` then falls
   * through to it, which is exactly what the box is showing.
   */
  const continueWithoutGstin = () => {
    setGstinError(null);
    updateData({ gstin: "", gstinConfirmed: false, legalEntityName: "" });
  };

  const retainedMatches =
    retainedLink?.subscriptionStatus === "pending_payment" &&
    retainedLink.plan === FIXED_PLAN &&
    retainedLink.durationMonths === FIXED_DURATION_MONTHS &&
    retainedLink.historicDataMonths === FIXED_HISTORIC_MONTHS &&
    retainedLink.outletCount === data.numberOfRestaurants &&
    retainedLink.accountId === accountId &&
    (retainedLink.subscriptionId === null ||
      retainedLink.subscriptionId === retainedLink.rowSubscriptionId);
  const cancellationOperation =
    retainedLink?.paymentLinkId && retainedLink.accountId === accountId
      ? cancellationOperationsRef.current.get(
          paymentLinkOperationKey(accountId, retainedLink.paymentLinkId),
        )
      : undefined;
  const cancelState = cancellationOperation?.state ?? "idle";
  const cancellationBlocking =
    Boolean(cancellationOperation) && cancelState !== "cancelled";
  const ownerStartOperations = Array.from(
    startOperationsRef.current.values(),
  ).filter((operation) => operation.accountId === accountId);
  const failedOwnerStartOperation = ownerStartOperations.find(
    (operation) => operation.state === "cleanup_failed",
  );
  const ownerStartOperation =
    failedOwnerStartOperation ??
    ownerStartOperations.find((operation) => operation.state === "retiring") ??
    ownerStartOperations[0];
  const ownerOperationBlocking = ownerStartOperations.length > 0;
  const currentStartOperation = ownerStartOperations.find(
    (operation) => operation.purchaseKey === purchaseKey,
  );
  const preparingCurrentView =
    currentStartOperation?.state === "creating" &&
    currentStartOperation.viewToken === committedViewRef.current.token;
  const awaitingPayment =
    Boolean(retainedLink) &&
    retainedMatches &&
    !cancellationBlocking &&
    !ownerOperationBlocking &&
    isUsablePaymentLink(retainedLink);
  const staleLinkWithId =
    Boolean(retainedLink) &&
    (!retainedMatches || cancellationBlocking) &&
    Boolean(retainedLink?.paymentLinkId) &&
    retainedLink?.accountId === accountId;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // GET /me/onboarding is authoritative. A webhook-driven refresh that closes
  // or hides the link must remove the old URL from this mounted screen.
  useEffect(() => {
    const serverLink = retainedFromServer(accountId, payment, subscription);
    const serverCancellation =
      serverLink?.paymentLinkId
        ? cancellationOperationsRef.current.get(
            paymentLinkOperationKey(accountId, serverLink.paymentLinkId),
          )
        : undefined;
    const next =
      serverCancellation?.state === "cancelled" ? null : serverLink;
    if (ownerScopeRef.current !== accountId) {
      ownerScopeRef.current = accountId;
      retainedRef.current = next;
      setRetainedLink(next);
      setChecking(false);
      setCheckMessage(null);
      setError(null);
      return;
    }
    const current = retainedRef.current;
    const currentCancellation =
      current?.paymentLinkId && current.accountId === accountId
        ? cancellationOperationsRef.current.get(
            paymentLinkOperationKey(accountId, current.paymentLinkId),
          )
        : undefined;
    const inFlightLinkId =
      currentCancellation &&
      (currentCancellation.state === "pending" ||
        currentCancellation.state === "checking_settlement")
        ? currentCancellation.linkId
        : undefined;
    const sameInFlightLink =
      Boolean(inFlightLinkId) &&
      current?.paymentLinkId === inFlightLinkId &&
      (next === null ||
        next.paymentLinkId === inFlightLinkId ||
        (next.paymentLinkId === null && next.shortUrl === current.shortUrl));
    if (sameInFlightLink) return;
    retainedRef.current = next;
    setRetainedLink(next);
  }, [accountId, payment, subscription]);

  const retireCreatedLink = useCallback(
    async (target: BaseCleanupTarget, retry = false) => {
      const {
        accountId: targetAccountId,
        linkId,
        subscriptionId,
        outletCount,
      } = target;
      const operationKey = paymentLinkOperationKey(targetAccountId, linkId);
      const existing =
        cancellationOperationsRef.current.get(operationKey);
      if (existing && (existing.state !== "failed" || !retry)) {
        await existing.promise;
        return (
          cancellationOperationsRef.current.get(operationKey)?.state ===
          "cancelled"
        );
      }

      const request = Promise.resolve().then(async () => {
        try {
          await api.post(`/me/onboarding/payment-links/${linkId}/cancel`, {});
          const current =
            cancellationOperationsRef.current.get(operationKey);
          if (current?.promise === request) {
            current.state = "cancelled";
            bumpOperations();
          }
        } catch (err) {
          const alreadyTerminal =
            err instanceof ApiError &&
            err.status === 409 &&
            /cancelled|expired/i.test(err.message);
          let reconciled = alreadyTerminal;

          if (
            !reconciled &&
            err instanceof ApiError &&
            err.status === 409 &&
            accountIdRef.current === targetAccountId
          ) {
            try {
              const refreshed = await refresh();
              reconciled =
                accountIdRef.current === targetAccountId &&
                refreshed?.subscription?.id === subscriptionId &&
                refreshed.subscription.status === "active" &&
                refreshed.subscription.plan === FIXED_PLAN &&
                refreshed.subscription.durationMonths ===
                  FIXED_DURATION_MONTHS &&
                refreshed.subscription.historicDataMonths ===
                  FIXED_HISTORIC_MONTHS &&
                refreshed.subscription.outletCount === outletCount &&
                refreshed?.payment?.subscriptionId === subscriptionId &&
                refreshed.payment.paymentLinkId === linkId &&
                refreshed.payment.status === "paid";
            } catch {
              reconciled = false;
            }
          }

          const current =
            cancellationOperationsRef.current.get(operationKey);
          if (current?.promise === request) {
            current.state = reconciled ? "cancelled" : "failed";
            bumpOperations();
          }
        }
      });

      cancellationOperationsRef.current.set(operationKey, {
        accountId: targetAccountId,
        linkId,
        state: "pending",
        promise: request,
      });
      bumpOperations();
      await request;
      return (
        cancellationOperationsRef.current.get(operationKey)?.state ===
        "cancelled"
      );
    },
    [bumpOperations, refresh],
  );

  const cancelRetainedLink = useCallback(
    (target: RetainedBasePaymentLink, retry = false) => {
      const linkId = target.paymentLinkId;
      const targetAccountId = target.accountId;
      if (!linkId || targetAccountId !== accountIdRef.current) {
        return Promise.resolve();
      }
      const operationKey = paymentLinkOperationKey(targetAccountId, linkId);
      const existing =
        cancellationOperationsRef.current.get(operationKey);
      if (existing && (existing.state !== "failed" || !retry)) {
        return existing.promise;
      }

      if (mountedRef.current && accountIdRef.current === targetAccountId) {
        setError(null);
      }

      const request = Promise.resolve().then(async () => {
        try {
          await api.post(`/me/onboarding/payment-links/${linkId}/cancel`, {});
          const current =
            cancellationOperationsRef.current.get(operationKey);
          if (current?.promise === request) {
            current.state = "cancelled";
            if (
              mountedRef.current &&
              accountIdRef.current === targetAccountId &&
              retainedRef.current?.accountId === targetAccountId &&
              retainedRef.current.paymentLinkId === linkId
            ) {
              retainedRef.current = null;
              setRetainedLink(null);
            }
            bumpOperations();
          }
        } catch (err: unknown) {
          const alreadyTerminal =
            err instanceof ApiError &&
            err.status === 409 &&
            /cancelled|expired/i.test(err.message);
          if (alreadyTerminal) {
            const current =
              cancellationOperationsRef.current.get(operationKey);
            if (current?.promise === request) {
              current.state = "cancelled";
            }
            if (
              mountedRef.current &&
              accountIdRef.current === targetAccountId &&
              retainedRef.current?.accountId === targetAccountId &&
              retainedRef.current.paymentLinkId === linkId
            ) {
              retainedRef.current = null;
              setRetainedLink(null);
            }
            bumpOperations();
            return;
          }

          if (err instanceof ApiError && err.status === 409) {
            const checking =
              cancellationOperationsRef.current.get(operationKey);
            if (checking?.promise === request) {
              checking.state = "checking_settlement";
              bumpOperations();
            }
            if (accountIdRef.current !== targetAccountId) {
              const current =
                cancellationOperationsRef.current.get(operationKey);
              if (current?.promise === request) {
                current.state = "failed";
                bumpOperations();
              }
              return;
            }
            let refreshed;
            try {
              refreshed = await refresh();
            } catch {
              refreshed = null;
            }
            if (accountIdRef.current !== targetAccountId) {
              const current =
                cancellationOperationsRef.current.get(operationKey);
              if (current?.promise === request) {
                current.state = "failed";
                bumpOperations();
              }
              return;
            }
            const settlementConfirmed =
              (refreshed?.payment?.paymentLinkId === linkId &&
                refreshed.payment.status === "paid") ||
              (refreshed?.subscription?.id === target.rowSubscriptionId &&
                refreshed.subscription.status === "active");
            if (settlementConfirmed) {
              const current =
                cancellationOperationsRef.current.get(operationKey);
              if (current?.promise === request) {
                current.state = "cancelled";
              }
              if (
                mountedRef.current &&
                accountIdRef.current === targetAccountId &&
                retainedRef.current?.accountId === targetAccountId &&
                retainedRef.current.paymentLinkId === linkId
              ) {
                retainedRef.current = null;
                setRetainedLink(null);
                setError(null);
              }
              bumpOperations();
              return;
            }
          }
          const current =
            cancellationOperationsRef.current.get(operationKey);
          if (current?.promise === request) {
            current.state = "failed";
            bumpOperations();
          }
          if (
            mountedRef.current &&
            accountIdRef.current === targetAccountId &&
            retainedRef.current?.accountId === targetAccountId &&
            retainedRef.current.paymentLinkId === linkId
          ) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Could not retire the previous payment link — retry before paying again",
            );
          }
        }
      });

      cancellationOperationsRef.current.set(operationKey, {
        accountId: targetAccountId,
        linkId,
        state: "pending",
        promise: request,
      });
      bumpOperations();
      return request;
    },
    [bumpOperations, refresh],
  );

  // Changing restaurant count invalidates the exact commercial identity. The
  // old link becomes non-reopenable immediately and is closed before another
  // link can be requested. Old hydrated links without an ID remain resumable
  // only while matching; UC supersedes them on the next create call.
  useEffect(() => {
    if (retainedLink && !retainedMatches && retainedLink.paymentLinkId) {
      void cancelRetainedLink(retainedLink);
    }
  }, [cancelRetainedLink, retainedLink, retainedMatches]);

  useEffect(() => {
    api
      .get<Preview>(`/public/pricing/preview?plan=${FIXED_PLAN}&outlets=${data.numberOfRestaurants}`)
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [data.numberOfRestaurants]);

  // Ask UC to reconcile with Razorpay directly, rather than waiting for a
  // webhook that may be late or (with no public URL registered) never arrive.
  // The endpoint is rate limited to 5 calls per 60s per account, so EVERY
  // trigger — timer, focus, tab visibility, the manual button — funnels through
  // this one gap plus the in-flight gate. Writes no state: an automatic check
  // must never flip the button to "Checking…" or pop "still waiting" at someone
  // who never asked.
  const reconcilePayment = useCallback(async () => {
    if (checkInFlightRef.current) return;
    if (Date.now() - lastCheckAtRef.current < RECHECK_MIN_GAP_MS) return;
    lastCheckAtRef.current = Date.now();
    checkInFlightRef.current = true;
    const checkedAccountId = accountIdRef.current;
    try {
      await api.post("/me/onboarding/subscription/check-payment", {});
    } catch {
      /* 429 / offline / 5xx — silent by design; the next trigger retries */
    } finally {
      checkInFlightRef.current = false;
    }
    if (accountIdRef.current !== checkedAccountId) return;
    await refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While a payment is out on Razorpay's page: listen for the push, and keep
  // both fallbacks under it. The socket carries `payment.settled` the instant
  // UC settles; the cheap 4s read keeps the page current either way; and the
  // reconcile above can settle the payment itself if no webhook ever lands.
  useEffect(() => {
    if (isPaid || !awaitingPayment) return undefined;

    let ws: WebSocket | null = null;
    let closed = false;
    const openSocket = () => {
      if (closed) return;
      try {
        ws = openOnboardingSocket({
          onMessage: (msg: OnboardingWsFrame) => {
            // Bare nudge — never trust anything inside it, just re-read.
            if (msg.type === "payment.settled") void refresh().catch(() => {});
          },
          onClose: () => { if (!closed) setTimeout(openSocket, 3000); },
        });
      } catch {
        /* no socket — the poll and the reconcile below still cover this */
      }
    };
    openSocket();

    void reconcilePayment(); // cold reload, or returning after paying
    const passive = setInterval(() => { refresh().catch(() => {}); }, 4000);
    const active = setInterval(() => { void reconcilePayment(); }, RECHECK_INTERVAL_MS);
    // Returning from the Razorpay tab is the highest-signal moment there is.
    const onActive = () => { void reconcilePayment(); };
    const onVisible = () => { if (document.visibilityState === "visible") onActive(); };
    window.addEventListener("focus", onActive);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      closed = true;
      ws?.close();
      clearInterval(passive);
      clearInterval(active);
      window.removeEventListener("focus", onActive);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaid, awaitingPayment, reconcilePayment]);

  // The identity card stays editable while a payment is out on the Razorpay
  // tab, but this branch renders no Pay button — so startPayment()'s persist()
  // call, the only one on this screen, is unreachable, and the next page
  // transition (the funnel's other save point) happens after settlement. A
  // GSTIN added here would therefore never reach UC before it cuts the licence
  // invoice. Commit identity edits on their own, debounced, while we wait.
  const identityKey = JSON.stringify([
    data.gstin ?? "",
    Boolean(data.gstinConfirmed),
    // Named explicitly rather than left to ride along on legalEntityName:
    // today every edit on this screen writes the pair together, but the name
    // printed on a tax invoice must not depend on that staying true.
    data.companyName ?? "",
    data.legalEntityName ?? "",
    data.billingAddress ?? "",
    data.billingStateCode ?? "",
  ]);
  const lastSentIdentityRef = useRef<string | null>(null);
  useEffect(() => {
    if (isPaid || !awaitingPayment) return undefined;
    // First render in this state: what is on screen came from the server
    // (resume) or was just written by startPayment. Nothing to send yet.
    if (lastSentIdentityRef.current === null) {
      lastSentIdentityRef.current = identityKey;
      return undefined;
    }
    if (lastSentIdentityRef.current === identityKey) return undefined;
    const timer = setTimeout(() => {
      lastSentIdentityRef.current = identityKey;
      void persistRef.current().catch(() => {
        // Best effort, like every other save in the funnel — but this one is
        // tax-decisive and there is no later save point on this screen, so
        // say so rather than letting them pay against a stale invoice.
        if (mountedRef.current) {
          setError(
            "Could not save your billing details. Check your connection and edit them again before paying.",
          );
        }
      });
    }, IDENTITY_COMMIT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // persist is re-created on every context render, so it is read through a
    // ref rather than depended on — otherwise this timer re-arms every render
    // and a customer who keeps typing is never saved at all.
  }, [isPaid, awaitingPayment, identityKey]);

  const startPayment = () => {
    const ownerHasStartOperation = Array.from(
      startOperationsRef.current.values(),
    ).some((operation) => operation.accountId === accountId);
    if (
      staleLinkWithId ||
      cancellationBlocking ||
      ownerHasStartOperation ||
      identityIncomplete
    ) {
      return;
    }
    const requestedAccountId = accountId;
    const requestedOutletCount = data.numberOfRestaurants;
    const requestedPurchaseKey = purchaseKey;
    const requestedViewToken = committedViewRef.current.token;
    const generation = ++nextStartGenerationRef.current;
    setError(null);

    const request = Promise.resolve().then(async () => {
      try {
        // The licence invoice is cut the moment payment settles, and
        // settlement can arrive (webhook / poll / socket) before the wizard
        // ever reaches a page transition, which is the only other place
        // this data is persisted. Write the just-entered GSTIN / billing
        // address / billing state now, BEFORE the subscription is created —
        // otherwise the `refresh()` a few lines down re-spreads the
        // server's stale (often empty) business blob over what the
        // customer just typed and the tax identity is gone for good.
        await persist();
        const r = await api.post<CreatedBasePaymentLink>(
          "/me/onboarding/subscription",
          {
            outletCount: requestedOutletCount,
          },
        );
        const currentOperation =
          startOperationsRef.current.get(requestedPurchaseKey);
        const responseBelongsToCurrentView =
          currentOperation?.generation === generation &&
          currentOperation.promise === request &&
          mountedRef.current &&
          accountIdRef.current === requestedAccountId &&
          purchaseKeyRef.current === requestedPurchaseKey &&
          committedViewRef.current.token === requestedViewToken;

        if (!responseBelongsToCurrentView) {
          if (currentOperation?.generation === generation) {
            currentOperation.state = "retiring";
            currentOperation.cleanupTarget = {
              accountId: requestedAccountId,
              linkId: r.paymentLinkId,
              subscriptionId: r.subscriptionId,
              outletCount: r.outletCount,
            };
            bumpOperations();
          }
          const retired = await retireCreatedLink({
            accountId: requestedAccountId,
            linkId: r.paymentLinkId,
            subscriptionId: r.subscriptionId,
            outletCount: r.outletCount,
          });
          const latestOperation =
            startOperationsRef.current.get(requestedPurchaseKey);
          if (
            latestOperation?.generation === generation &&
            latestOperation.promise === request
          ) {
            if (retired) {
              startOperationsRef.current.delete(requestedPurchaseKey);
            } else {
              latestOperation.state = "cleanup_failed";
              if (
                mountedRef.current &&
                accountIdRef.current === requestedAccountId
              ) {
                setError(
                  "Could not retire the stale payment link — payment remains blocked",
                );
              }
            }
            bumpOperations();
          }
          return;
        }

        const next: RetainedBasePaymentLink = {
          accountId: requestedAccountId,
          paymentLinkId: r.paymentLinkId,
          subscriptionId: r.subscriptionId,
          rowSubscriptionId: r.subscriptionId,
          shortUrl: r.shortUrl,
          status: "created",
          expiresAt: null,
          amount: r.amount,
          outletCount: r.outletCount,
          plan: FIXED_PLAN,
          durationMonths: FIXED_DURATION_MONTHS,
          historicDataMonths: FIXED_HISTORIC_MONTHS,
          subscriptionStatus: "pending_payment",
        };
        startOperationsRef.current.delete(requestedPurchaseKey);
        retainedRef.current = next;
        setRetainedLink(next);
        bumpOperations();
        window.open(r.shortUrl, "_blank", "noopener");
        await refresh().catch(() => {});
      } catch (err) {
        const currentOperation =
          startOperationsRef.current.get(requestedPurchaseKey);
        if (
          currentOperation?.generation === generation &&
          currentOperation.promise === request
        ) {
          startOperationsRef.current.delete(requestedPurchaseKey);
          bumpOperations();
        }
        if (
          mountedRef.current &&
          accountIdRef.current === requestedAccountId &&
          purchaseKeyRef.current === requestedPurchaseKey &&
          committedViewRef.current.token === requestedViewToken
        ) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not start the payment — try again",
          );
        }
      }
    });

    startOperationsRef.current.set(requestedPurchaseKey, {
      accountId: requestedAccountId,
      purchaseKey: requestedPurchaseKey,
      generation,
      viewToken: requestedViewToken,
      state: "creating",
      promise: request,
    });
    bumpOperations();
  };

  const retryStaleCreationCleanup = () => {
    const operation = failedOwnerStartOperation;
    const cleanupTarget = operation?.cleanupTarget;
    if (
      operation?.state !== "cleanup_failed" ||
      operation.accountId !== accountId ||
      !cleanupTarget
    ) {
      return;
    }

    const operationKey = operation.purchaseKey;
    operation.state = "retiring";
    setError(null);
    bumpOperations();
    void retireCreatedLink(cleanupTarget, true).then((retired) => {
      if (startOperationsRef.current.get(operationKey) !== operation) return;
      if (retired) {
        startOperationsRef.current.delete(operationKey);
      } else {
        operation.state = "cleanup_failed";
        if (
          mountedRef.current &&
          accountIdRef.current === operation.accountId
        ) {
          setError(
            "Could not retire the stale payment link — payment remains blocked",
          );
        }
      }
      bumpOperations();
    });
  };

  // Self-serve fallback for when the webhook hasn't landed yet (delayed
  // delivery, or no public webhook URL registered at all): asks UC to check
  // directly with Razorpay instead of waiting on the poll to pick up a webhook
  // that may never arrive.
  const checkPaymentStatus = async () => {
    const checkedAccountId = accountId;
    // An explicit request always wins the gap, but it books a slot so the
    // automatic loop backs off and the two together stay inside the limit.
    checkInFlightRef.current = true;
    lastCheckAtRef.current = Date.now();
    setChecking(true);
    setCheckMessage(null);
    try {
      const r = await api.post<{ resolved: boolean }>("/me/onboarding/subscription/check-payment", {});
      if (accountIdRef.current !== checkedAccountId) return;
      await refresh().catch(() => {});
      if (accountIdRef.current !== checkedAccountId) return;
      if (!r.resolved) setCheckMessage("Still waiting — we haven't seen a completed payment yet.");
    } catch (err) {
      if (accountIdRef.current === checkedAccountId) {
        setCheckMessage(err instanceof ApiError ? err.message : "Could not check payment status — try again");
      }
    } finally {
      checkInFlightRef.current = false;
      if (accountIdRef.current === checkedAccountId) setChecking(false);
    }
  };

  if (isPaid) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="w-16 h-16 rounded-full gradient-mint flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payment Confirmed</h2>
          <p className="text-muted-foreground mt-2">
            {subscription
              ? `${FIXED_PLAN} plan · ${subscription.outletCount} outlet${subscription.outletCount > 1 ? "s" : ""} · ₹${Number(subscription.totalAmount).toLocaleString()}`
              : "Your subscription is active."}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Continue to connect your payout email.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Payment</h2>
        <p className="text-muted-foreground mt-1">
          Make one secure one-time Annual payment for your 12-month subscription on Razorpay.
        </p>
      </div>

      {/* Billing & tax identity — GSTIN optional, address + state mandatory.
          Place of supply decides CGST+SGST vs IGST on the invoice; without a
          billing state on file it silently falls back to our own West Bengal
          registration, which is wrong for every customer outside WB. */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Billing &amp; Tax Identity</h3>

        <div className="space-y-2">
          <Label htmlFor="gstin-input">
            GSTIN <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="gstin-input"
              value={data.gstin ?? ""}
              onChange={(e) => {
                // Clearing the rejection here (not just at the start of the
                // NEXT verify) is what lets someone empty the field and
                // proceed as B2C without "This GSTIN is Cancelled…" following
                // them down the page — they never run a second verify.
                setGstinError(null);
                updateData({
                  gstin: e.target.value,
                  gstinConfirmed: false,
                  // The registered name for tax purposes belongs to the
                  // number that was verified, so it goes when the number is
                  // touched — exactly as continueWithoutGstin does, because
                  // emptying this field by hand is the same act and the
                  // commoner one. Leave it behind and UC promotes it
                  // independently of the gstin, while invoiceService renders
                  // `account.legalEntityName || account.name`: a B2C invoice
                  // billed to a GST register entity the customer no longer
                  // claims, or a B2B one under the wrong company's name.
                  // confirmGstinDetails writes it back on the next confirm.
                  //
                  // companyName is deliberately absent: touching the GSTIN
                  // unlocks the name box (gstinConfirmed drops in this same
                  // update) but must never empty it. See continueWithoutGstin.
                  legalEntityName: "",
                });
              }}
              placeholder="22AAAAA0000A1Z5"
              className="bg-secondary border-border h-11 uppercase"
              disabled={gstinVerifying}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleVerifyGstin}
              disabled={gstinVerifying || !isValidGstinFormat(data.gstin ?? "")}
              className="h-11 shrink-0"
            >
              {gstinVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
            </Button>
          </div>
          {gstinError && <p className="text-sm text-destructive">{gstinError}</p>}
          {data.gstin && data.gstinConfirmed && (
            <p className="text-xs text-primary flex items-center gap-1">
              <Check className="h-3 w-3" /> GSTIN verified
            </p>
          )}
        </div>

        {/* The company name — the SAME field the customer typed on wizard
            page 0 (data.companyName), shown here because this is where the
            GST register fills it in. There is deliberately no second "legal
            entity name" box beside it: one name, and when a GSTIN is verified
            that name is the register's.

            It writes companyName and legalEntityName together. UC's
            invoiceService renders `account.legalEntityName || account.name`,
            so a name that lands in only one of them can be silently outranked
            by a stale value in the other — a name the customer cannot see on
            any screen. Writing both keeps the invoice equal to this box.

            Sits directly under the GSTIN so name, address and state read as
            the one group the register fills in. */}
        <div className="space-y-2">
          <Label htmlFor="company-name-input">
            Company / Brand Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="company-name-input"
            value={String(data.companyName ?? "")}
            onChange={(e) =>
              updateData({
                companyName: e.target.value,
                legalEntityName: e.target.value,
              })
            }
            placeholder="e.g. Foodie Brands Pvt Ltd"
            className="bg-secondary border-border h-11"
            // Exactly the condition the Billing State select below uses, and
            // for the same reason: once the register has spoken it is
            // authoritative, and the supported way to change this name is to
            // re-verify — or clear — the GSTIN above. gstinConfirmed is the
            // right flag rather than `data.gstin && data.gstinConfirmed`,
            // because touching the GSTIN input drops gstinConfirmed in the
            // same updateData that would have staled this name: the two can
            // never disagree. Freely editable while no GSTIN is confirmed,
            // because a B2C customer still has a name to be invoiced under.
            disabled={Boolean(data.gstinConfirmed)}
          />
          <p className="text-xs text-muted-foreground">
            {data.gstinConfirmed
              ? "Set from your verified GSTIN — this is the name on your tax invoices. Clear or change the GSTIN above to edit it."
              : "The name your tax invoices will carry."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-address-input">
            Billing Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="billing-address-input"
            value={data.billingAddress ?? ""}
            onChange={(e) => updateData({ billingAddress: e.target.value })}
            placeholder="Registered / billing address"
            className="bg-secondary border-border h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-state-select">
            Billing State <span className="text-destructive">*</span>
          </Label>
          {/* Native <select>, not the Radix Select: Radix 2.3.2 needs
              ResizeObserver/scrollIntoView/pointer-capture polyfills this
              repo's jsdom setup doesn't provide. Styled to match the
              shadcn Inputs beside it. */}
          <select
            id="billing-state-select"
            value={data.billingStateCode ?? ""}
            onChange={(e) => updateData({ billingStateCode: e.target.value })}
            // Locked once the register has spoken: the place of supply may not
            // contradict the registration the customer just confirmed (confirm
            // a Maharashtra GSTIN, then pick West Bengal, and the invoice
            // charges CGST+SGST on an inter-state supply). Freely editable
            // while no GSTIN is confirmed — a customer without one still has to
            // choose a state. Mirrors admin-frontend's disabled={gstinConfirmed}.
            disabled={Boolean(data.gstinConfirmed)}
            className="flex h-11 w-full rounded-md border border-input bg-secondary border-border px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-foreground"
          >
            <option value="">Select state…</option>
            {GST_STATE_CODES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
          {data.gstinConfirmed && (
            <p className="text-xs text-muted-foreground">
              Set from your verified GSTIN. Clear or change the GSTIN above to choose a different state.
            </p>
          )}
        </div>
      </div>

      <AlertDialog open={gstinDialogOpen} onOpenChange={(open) => { if (!open) closeGstinDialog(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use verified GSTIN details?</AlertDialogTitle>
            <AlertDialogDescription>
              Continuing will replace your company name, billing address and state with these GSTIN-registered details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingGstinDetails && (
            <div className="rounded-lg bg-secondary/50 p-3 text-sm space-y-1">
              <div className="font-medium text-foreground">{pendingGstinDetails.legalName}</div>
              <div className="text-muted-foreground">
                {pendingGstinDetails.address ??
                  "No address on the GST register — your billing address is left unchanged."}
              </div>
              <div className="text-muted-foreground">{pendingGstinDetails.stateName}</div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeGstinDialog}>Cancel</AlertDialogCancel>
            {/* Named to not collide with getByRole(/Pay .* securely/i) —
                three payment-button branches already match that pattern. */}
            <AlertDialogAction onClick={confirmGstinDetails}>Use these details</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order summary */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="text-foreground font-medium">{FIXED_PLAN}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restaurants</span>
              <span className="text-foreground font-medium">{data.numberOfRestaurants}</span>
            </div>
            {preview && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base</span>
                  <span className="text-foreground">₹{preview.gross.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="text-foreground">₹{preview.gstAmount.toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-baseline">
                  <span className="text-muted-foreground">Total for {preview.durationMonths} month{preview.durationMonths > 1 ? "s" : ""}</span>
                  <span className="text-xl font-bold text-gradient-mint">₹{preview.totalAmount.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pay */}
        <div className="glass-card rounded-2xl p-6 space-y-4 h-fit">
          {ownerOperationBlocking ? (
            <div className="space-y-3">
              <Button
                disabled
                className="w-full gradient-mint text-primary-foreground h-11"
              >
                {preparingCurrentView
                  ? "Preparing secure payment…"
                  : preview
                    ? `Pay ₹${preview.totalAmount.toLocaleString()} securely`
                    : "Loading…"}
              </Button>
              <p className="text-sm text-muted-foreground">
                {ownerStartOperation?.state === "cleanup_failed"
                  ? "The previous payment link is still payable. Retire it before starting another payment."
                  : ownerStartOperation?.state === "retiring"
                    ? "Retiring the previous payment link before another payment can start…"
                    : "Finishing the previous payment request before another payment can start…"}
              </p>
              {failedOwnerStartOperation && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={retryStaleCreationCleanup}
                >
                  Retry retiring stale payment link
                </Button>
              )}
            </div>
          ) : awaitingPayment && retainedLink ? (
            <>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <div className="text-sm font-medium text-foreground">Waiting for your payment…</div>
                  <div className="text-xs text-muted-foreground">Complete it in the Razorpay tab; this page updates automatically.</div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(retainedLink.shortUrl, "_blank", "noopener")}
              >
                <ExternalLink className="h-4 w-4 mr-2" /> Reopen payment page
              </Button>
              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={checkPaymentStatus}
                disabled={checking}
              >
                {checking ? "Checking…" : "Already paid? Check status"}
              </Button>
              {checkMessage && <p className="text-xs text-muted-foreground text-center">{checkMessage}</p>}
            </>
          ) : staleLinkWithId ? (
            <div className="space-y-3">
              <Button
                disabled
                className="w-full gradient-mint text-primary-foreground h-11"
              >
                {preview
                  ? `Pay ₹${preview.totalAmount.toLocaleString()} securely`
                  : "Loading…"}
              </Button>
              <p className="text-sm text-muted-foreground">
                {cancelState === "pending"
                  ? "Retiring the previous payment link…"
                  : "The previous payment link no longer matches this outlet count."}
              </p>
              {cancelState === "failed" && retainedLink && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void cancelRetainedLink(retainedLink, true)}
                >
                  Retry cancelling old payment link
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={startPayment}
                disabled={!preview || identityIncomplete}
                className="w-full gradient-mint text-primary-foreground hover:opacity-90 h-11"
              >
                {preparingCurrentView
                  ? "Preparing secure payment…"
                  : preview
                    ? `Pay ₹${preview.totalAmount.toLocaleString()} securely`
                    : "Loading…"}
              </Button>
              {payBlockedReasons.length > 0 && (
                <p className="text-sm text-muted-foreground" role="note">
                  Payment is disabled until you {joinReasons(payBlockedReasons)}.
                </p>
              )}
              {gstinUnconfirmed && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={continueWithoutGstin}
                >
                  Continue without a GSTIN
                </Button>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> PCI-DSS via Razorpay</span>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> 256-bit SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}

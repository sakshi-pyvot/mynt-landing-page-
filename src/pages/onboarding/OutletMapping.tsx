import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  FIXED_DURATION_MONTHS,
  FIXED_HISTORIC_MONTHS,
  FIXED_PLAN,
  useOnboarding,
  type OnboardingPayment,
  type OnboardingSubscription,
  type Outlet,
} from "@/contexts/OnboardingContext";
import { api, ApiError } from "@/lib/api";
import { isUsablePaymentLink } from "@/lib/paymentLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus, Check, AlertTriangle, Search, Store, Link2, Tag,
  ChevronRight, ArrowRight, Unlink, X, Sparkles,
  CreditCard, Loader2, ExternalLink,
} from "lucide-react";
import { toDetected, type DiscoveredResId } from "./RestaurantDetection";

// Real outlet mapping (SCRUM-72 Phase 5): every mutation lands in UC (the
// outlet source of truth) through /me/onboarding/outlets — the same repo the
// admin panel's Detect & Map drives. UC's response is re-loaded after each
// write so this page never trusts its own optimistic state.

/** UC outlet row (camelCase) → the funnel's Outlet shape. */
interface UcOutlet {
  id: number;
  name: string;
  brand?: string | null;
  group_name?: string | null;
  status?: string;
  platformIds: { platform: string; resId: string }[];
}

const toFunnelOutlet = (uc: UcOutlet): Outlet => ({
  id: String(uc.id),
  name: uc.name,
  brand: uc.brand ?? "",
  group: uc.group_name ?? "",
  zomatoId: uc.platformIds.find((p) => p.platform === "zomato")?.resId,
  swiggyId: uc.platformIds.find((p) => p.platform === "swiggy")?.resId,
});

/** One shared loader: outlets from UC + assignment flags onto detected IDs. */
function useOutlets() {
  const { data, outletStep } = useOnboarding();

  const load = useCallback(async () => {
    const rows = await api.get<UcOutlet[]>("/me/onboarding/outlets");
    const outlets = rows.filter((r) => r.status !== "Inactive").map(toFunnelOutlet);
    const linkedIds = new Map<string, string>(); // resId → outletId
    outlets.forEach((o) => {
      if (o.zomatoId) linkedIds.set(`zomato:${o.zomatoId}`, o.id);
      if (o.swiggyId) linkedIds.set(`swiggy:${o.swiggyId}`, o.id);
    });
    // Only a LIVE Detect scan fills `detectedRestaurants`, so a reload left the
    // panel empty with nothing to link. Read the durable list back, but only
    // from Link IDs onward — step 0's payment gating counts this loader's calls.
    let detected = data.detectedRestaurants;
    if (detected.length === 0 && outletStep >= 1) {
      const r = await api
        .get<{ resIds?: DiscoveredResId[] }>("/me/onboarding/detected")
        .catch(() => null);
      if (r) detected = toDetected(r.resIds ?? []);
    }
    return {
      outlets,
      detectedRestaurants: detected.map((r) => ({
        ...r,
        assignedOutletId: linkedIds.get(`${r.platform}:${r.platformId}`),
      })),
    };
  }, [data.detectedRestaurants, outletStep]);

  return { load };
}

const surface = (err: unknown, fallback: string) => {
  if (err instanceof ApiError && err.status === 409) {
    toast.error("That platform ID is already registered to another account — contact support.");
  } else {
    toast.error(err instanceof Error ? err.message : fallback);
  }
};

/* ── Step progress ── */
function StepProgress({ step }: { step: number }) {
  const steps = [
    { label: "Create Outlets", icon: Store },
    { label: "Link IDs", icon: Link2 },
    { label: "Brand & Group", icon: Tag },
    { label: "Confirm", icon: Check },
  ];
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map(({ label, icon: Icon }, i) => (
        <div key={label} className="flex items-center flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-300 ${
                i < step
                  ? "gradient-mint text-primary-foreground"
                  : i === step
                  ? "bg-primary/20 text-primary ring-2 ring-primary/40"
                  : "bg-secondary text-muted-foreground/40"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                i <= step ? "text-foreground" : "text-muted-foreground/40"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className={`h-3.5 w-3.5 mx-1 shrink-0 ${i < step ? "text-primary" : "text-muted-foreground/20"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface TopUpIdentity {
  accountId: number | null;
  mappedOutletCount: number;
  paidOutletCount: number;
  extraOutletCount: number;
}

interface CreatedTopUpPaymentLink {
  subscriptionId: string;
  paymentLinkId: string;
  shortUrl: string;
  amount: string;
  outletCount: number;
}

interface RetainedTopUpPaymentLink {
  paymentLinkId: string | null;
  subscriptionId: string | null;
  rowSubscriptionId: string;
  shortUrl: string;
  amount: string;
  status: string | null;
  expiresAt: string | null;
  requestedOutletCount: number;
  returnedOutletCount: number;
  identity: TopUpIdentity;
  plan: string;
  durationMonths: number;
  historicDataMonths: number;
  subscriptionStatus: string;
}

type TopUpCancellationState =
  | "pending"
  | "failed"
  | "checking_settlement"
  | "cancelled";

interface TopUpCancellationOperation {
  accountId: number | null;
  linkId: string;
  state: TopUpCancellationState;
  promise: Promise<void>;
}

interface TopUpCleanupTarget {
  accountId: number | null;
  linkId: string;
  subscriptionId: string;
  outletCount: number;
  minimumPaidOutletCount: number;
}

interface TopUpStartOperation {
  accountId: number | null;
  purchaseKey: string;
  generation: number;
  viewToken: number;
  state: "creating" | "retiring" | "cleanup_failed";
  cleanupTarget?: TopUpCleanupTarget;
  promise: Promise<void>;
}

const topUpPaymentLinkOperationKey = (
  accountId: number | null,
  linkId: string,
) => `${accountId ?? "unknown"}:${linkId}`;

const topUpIdentityKey = (identity: TopUpIdentity) =>
  [
    identity.accountId ?? "unknown",
    identity.mappedOutletCount,
    identity.paidOutletCount,
    identity.extraOutletCount,
  ].join(":");

const retainedTopUpFromServer = (
  accountId: number | null,
  paidOutletCount: number,
  payment: OnboardingPayment | null,
  subscription: OnboardingSubscription | null,
): RetainedTopUpPaymentLink | null => {
  if (!payment || !subscription || !isUsablePaymentLink(payment)) return null;
  const returnedOutletCount = subscription.outletCount;
  return {
    paymentLinkId: payment.paymentLinkId ?? null,
    subscriptionId: payment.subscriptionId ?? null,
    rowSubscriptionId: subscription.id,
    shortUrl: payment.shortUrl,
    amount: subscription.totalAmount,
    status: payment.status,
    expiresAt: payment.expiresAt ?? null,
    requestedOutletCount: returnedOutletCount,
    returnedOutletCount,
    identity: {
      accountId,
      mappedOutletCount: paidOutletCount + returnedOutletCount,
      paidOutletCount,
      extraOutletCount: returnedOutletCount,
    },
    plan: subscription.plan,
    durationMonths: subscription.durationMonths,
    historicDataMonths: subscription.historicDataMonths,
    subscriptionStatus: subscription.status,
  };
};

/* ── Billing counter — REAL top-up (paid 34, mapped 38 → pay for the extra 4):
      creates the delta subscription on UC (fixed Annual plan, one-shot
      Razorpay link), opens the hosted page, and polls until the webhook raises
      the paid capacity — at which point the extra outlets start ingesting. ── */
export function BillingCounter({
  outlets,
  outletsHydrated = true,
}: {
  outlets: number;
  /** The UC outlet loader has returned the count used for pricing identity. */
  outletsHydrated?: boolean;
}) {
  const {
    accountId,
    paidOutletCount,
    payment,
    subscription,
    refresh,
  } = useOnboarding();
  const [retainedLink, setRetainedLink] =
    useState<RetainedTopUpPaymentLink | null>(() =>
      retainedTopUpFromServer(accountId, paidOutletCount, payment, subscription),
    );
  const [, setOperationVersion] = useState(0);
  const retainedRef = useRef(retainedLink);
  const mountedRef = useRef(true);
  const cancellationOperationsRef =
    useRef(new Map<string, TopUpCancellationOperation>());
  const startOperationsRef =
    useRef(new Map<string, TopUpStartOperation>());
  const ownerScopeRef = useRef(accountId);
  const accountIdRef = useRef(accountId);
  const paidOutletCountRef = useRef(paidOutletCount);
  const currentIdentityKeyRef = useRef("");
  const currentIdentityRef = useRef<TopUpIdentity | null>(null);
  const nextStartGenerationRef = useRef(0);
  retainedRef.current = retainedLink;
  accountIdRef.current = accountId;
  paidOutletCountRef.current = paidOutletCount;

  const planLimit = paidOutletCount || 0;
  const extra = Math.max(0, outlets - planLimit);
  const pct = planLimit > 0 ? Math.min(100, (outlets / planLimit) * 100) : 0;
  const currentIdentity: TopUpIdentity = {
    accountId,
    mappedOutletCount: outlets,
    paidOutletCount: planLimit,
    extraOutletCount: extra,
  };
  const currentIdentityKey = topUpIdentityKey(currentIdentity);
  const committedViewRef = useRef({ key: currentIdentityKey, token: 0 });
  currentIdentityKeyRef.current = currentIdentityKey;
  currentIdentityRef.current = currentIdentity;
  useLayoutEffect(() => {
    if (committedViewRef.current.key !== currentIdentityKey) {
      committedViewRef.current = {
        key: currentIdentityKey,
        token: committedViewRef.current.token + 1,
      };
    }
  }, [currentIdentityKey]);

  const bumpOperations = useCallback(() => {
    if (mountedRef.current) setOperationVersion((version) => version + 1);
  }, []);

  const identityMatches =
    outletsHydrated &&
    Boolean(retainedLink) &&
    topUpIdentityKey(retainedLink!.identity) === topUpIdentityKey(currentIdentity) &&
    retainedLink!.requestedOutletCount === extra &&
    retainedLink!.returnedOutletCount === extra &&
    retainedLink!.subscriptionStatus === "pending_payment" &&
    retainedLink!.plan === FIXED_PLAN &&
    retainedLink!.durationMonths === FIXED_DURATION_MONTHS &&
    retainedLink!.historicDataMonths === FIXED_HISTORIC_MONTHS &&
    (retainedLink!.subscriptionId === null ||
      retainedLink!.subscriptionId === retainedLink!.rowSubscriptionId);
  const cancellationOperation =
    retainedLink?.paymentLinkId &&
    retainedLink.identity.accountId === accountId
      ? cancellationOperationsRef.current.get(
          topUpPaymentLinkOperationKey(
            accountId,
            retainedLink.paymentLinkId,
          ),
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
    (operation) => operation.purchaseKey === currentIdentityKey,
  );
  const preparingCurrentView =
    currentStartOperation?.state === "creating" &&
    currentStartOperation.viewToken === committedViewRef.current.token;
  const canReopen =
    Boolean(retainedLink) &&
    identityMatches &&
    !cancellationBlocking &&
    !ownerOperationBlocking &&
    isUsablePaymentLink(retainedLink);
  const staleLinkWithId =
    outletsHydrated &&
    Boolean(retainedLink) &&
    (!identityMatches || cancellationBlocking) &&
    Boolean(retainedLink?.paymentLinkId) &&
    retainedLink?.identity.accountId === accountId;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Refreshed UC state is authoritative. In particular, a paid/cancelled/
  // expired link with shortUrl:null must remove the old reopen affordance.
  useEffect(() => {
    const serverLink = retainedTopUpFromServer(
      accountId,
      paidOutletCountRef.current,
      payment,
      subscription,
    );
    const serverCancellation =
      serverLink?.paymentLinkId
        ? cancellationOperationsRef.current.get(
            topUpPaymentLinkOperationKey(
              accountId,
              serverLink.paymentLinkId,
            ),
          )
        : undefined;
    const next =
      serverCancellation?.state === "cancelled" ? null : serverLink;
    if (ownerScopeRef.current !== accountId) {
      ownerScopeRef.current = accountId;
      retainedRef.current = next;
      setRetainedLink(next);
      return;
    }
    const current = retainedRef.current;
    const currentCancellation =
      current?.paymentLinkId &&
      current.identity.accountId === accountId
        ? cancellationOperationsRef.current.get(
            topUpPaymentLinkOperationKey(
              accountId,
              current.paymentLinkId,
            ),
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

  const retireCreatedTopUpLink = useCallback(
    async (target: TopUpCleanupTarget, retry = false) => {
      const {
        accountId: targetAccountId,
        linkId,
        subscriptionId,
        outletCount,
        minimumPaidOutletCount,
      } = target;
      const operationKey = topUpPaymentLinkOperationKey(
        targetAccountId,
        linkId,
      );
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
              const refreshedPaidOutletCount = Number(
                refreshed?.paidOutletCount,
              );
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
                refreshed.payment.status === "paid" &&
                Number.isFinite(refreshedPaidOutletCount) &&
                refreshedPaidOutletCount >= minimumPaidOutletCount;
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
    (target: RetainedTopUpPaymentLink, retry = false) => {
      const linkId = target.paymentLinkId;
      const targetAccountId = target.identity.accountId;
      if (!linkId || targetAccountId !== accountIdRef.current) {
        return Promise.resolve();
      }
      const operationKey = topUpPaymentLinkOperationKey(
        targetAccountId,
        linkId,
      );
      const existing =
        cancellationOperationsRef.current.get(operationKey);
      if (existing && (existing.state !== "failed" || !retry)) {
        return existing.promise;
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
              retainedRef.current?.identity.accountId === targetAccountId &&
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
              retainedRef.current?.identity.accountId === targetAccountId &&
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
              const current =
                cancellationOperationsRef.current.get(operationKey);
              if (current?.promise === request) {
                current.state = "failed";
                bumpOperations();
              }
              return;
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
            const refreshedPaidOutletCount = Number(refreshed?.paidOutletCount);
            const exactTargetSettled =
              refreshed?.subscription?.id === target.rowSubscriptionId &&
              refreshed.subscription.status === "active" &&
              refreshed?.payment?.subscriptionId === target.rowSubscriptionId &&
              refreshed.payment.paymentLinkId === linkId &&
              refreshed.payment.status === "paid";
            const settlementConfirmed =
              exactTargetSettled &&
              Number.isFinite(refreshedPaidOutletCount) &&
              refreshedPaidOutletCount >=
                target.identity.paidOutletCount + target.returnedOutletCount;
            const current = retainedRef.current;
            if (settlementConfirmed && accountIdRef.current === targetAccountId) {
              const operation =
                cancellationOperationsRef.current.get(operationKey);
              if (operation?.promise === request) {
                operation.state = "cancelled";
              }
              if (
                mountedRef.current &&
                (current === null ||
                  (current.identity.accountId === targetAccountId &&
                    current.paymentLinkId === linkId))
              ) {
                if (current?.paymentLinkId === linkId) {
                  retainedRef.current = null;
                  setRetainedLink(null);
                }
                const mappedOutletCount =
                  currentIdentityRef.current?.mappedOutletCount ??
                  target.identity.mappedOutletCount;
                toast.success(
                  refreshedPaidOutletCount >= mappedOutletCount
                    ? "Top-up received — all your outlets are covered."
                    : "Top-up received — recheck the remaining uncovered outlets.",
                );
              }
              bumpOperations();
            } else {
              const operation =
                cancellationOperationsRef.current.get(operationKey);
              if (operation?.promise === request) {
                operation.state = "failed";
                bumpOperations();
              }
            }
            return;
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
            retainedRef.current?.identity.accountId === targetAccountId &&
            retainedRef.current.paymentLinkId === linkId
          ) {
            surface(err, "Could not cancel the stale top-up payment");
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

  // Any count change invalidates the full pricing identity immediately. Keep
  // the complete record until UC confirms provider cancellation.
  useEffect(() => {
    if (
      outletsHydrated &&
      retainedLink &&
      !identityMatches &&
      retainedLink.paymentLinkId
    ) {
      void cancelRetainedLink(retainedLink);
    }
  }, [cancelRetainedLink, identityMatches, outletsHydrated, retainedLink]);

  // Poll only the currently usable, full-identity-matching link.
  useEffect(() => {
    if (!canReopen) return undefined;
    const interval = setInterval(() => refresh().catch(() => {}), 4000);
    return () => clearInterval(interval);
  }, [canReopen, refresh]);

  const startTopUp = () => {
    const ownerHasStartOperation = Array.from(
      startOperationsRef.current.values(),
    ).some((operation) => operation.accountId === accountId);
    if (
      !outletsHydrated ||
      ownerHasStartOperation ||
      cancellationBlocking ||
      staleLinkWithId ||
      canReopen ||
      extra < 1
    )
      return;
    const requestedAccountId = accountId;
    const requestedOutletCount = extra;
    const identity = currentIdentity;
    const requestedIdentityKey = topUpIdentityKey(identity);
    const requestedViewToken = committedViewRef.current.token;
    const generation = ++nextStartGenerationRef.current;

    const request = Promise.resolve().then(async () => {
      try {
        const r = await api.post<CreatedTopUpPaymentLink>(
          "/me/onboarding/subscription/top-up",
          {
            outletCount: requestedOutletCount,
          },
        );
        const currentOperation =
          startOperationsRef.current.get(requestedIdentityKey);
        const responseBelongsToCurrentView =
          currentOperation?.generation === generation &&
          currentOperation.promise === request &&
          mountedRef.current &&
          accountIdRef.current === requestedAccountId &&
          currentIdentityKeyRef.current === requestedIdentityKey &&
          committedViewRef.current.token === requestedViewToken;

        if (!responseBelongsToCurrentView) {
          if (currentOperation?.generation === generation) {
            currentOperation.state = "retiring";
            currentOperation.cleanupTarget = {
              accountId: requestedAccountId,
              linkId: r.paymentLinkId,
              subscriptionId: r.subscriptionId,
              outletCount: r.outletCount,
              minimumPaidOutletCount:
                identity.paidOutletCount + r.outletCount,
            };
            bumpOperations();
          }
          const retired = await retireCreatedTopUpLink({
            accountId: requestedAccountId,
            linkId: r.paymentLinkId,
            subscriptionId: r.subscriptionId,
            outletCount: r.outletCount,
            minimumPaidOutletCount:
              identity.paidOutletCount + r.outletCount,
          });
          const latestOperation =
            startOperationsRef.current.get(requestedIdentityKey);
          if (
            latestOperation?.generation === generation &&
            latestOperation.promise === request
          ) {
            if (retired) {
              startOperationsRef.current.delete(requestedIdentityKey);
            } else {
              latestOperation.state = "cleanup_failed";
              if (
                mountedRef.current &&
                accountIdRef.current === requestedAccountId
              ) {
                toast.error(
                  "Could not retire the stale top-up link — payment remains blocked",
                );
              }
            }
            bumpOperations();
          }
          return;
        }

        const next: RetainedTopUpPaymentLink = {
          paymentLinkId: r.paymentLinkId,
          subscriptionId: r.subscriptionId,
          rowSubscriptionId: r.subscriptionId,
          shortUrl: r.shortUrl,
          amount: r.amount,
          status: "created",
          expiresAt: null,
          requestedOutletCount,
          returnedOutletCount: r.outletCount,
          identity,
          plan: FIXED_PLAN,
          durationMonths: FIXED_DURATION_MONTHS,
          historicDataMonths: FIXED_HISTORIC_MONTHS,
          subscriptionStatus: "pending_payment",
        };
        startOperationsRef.current.delete(requestedIdentityKey);
        retainedRef.current = next;
        setRetainedLink(next);
        bumpOperations();
        window.open(r.shortUrl, "_blank", "noopener");
      } catch (err) {
        const currentOperation =
          startOperationsRef.current.get(requestedIdentityKey);
        if (
          currentOperation?.generation === generation &&
          currentOperation.promise === request
        ) {
          startOperationsRef.current.delete(requestedIdentityKey);
          bumpOperations();
        }
        if (
          mountedRef.current &&
          accountIdRef.current === requestedAccountId &&
          currentIdentityKeyRef.current === requestedIdentityKey &&
          committedViewRef.current.token === requestedViewToken
        ) {
          surface(err, "Could not start the top-up payment");
        }
      }
    });

    startOperationsRef.current.set(requestedIdentityKey, {
      accountId: requestedAccountId,
      purchaseKey: requestedIdentityKey,
      generation,
      viewToken: requestedViewToken,
      state: "creating",
      promise: request,
    });
    bumpOperations();
  };

  const retryStaleTopUpCleanup = () => {
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
    bumpOperations();
    void retireCreatedTopUpLink(cleanupTarget, true).then((retired) => {
      if (
        startOperationsRef.current.get(operationKey) !== operation
      ) {
        return;
      }
      if (retired) {
        startOperationsRef.current.delete(operationKey);
      } else {
        operation.state = "cleanup_failed";
        if (
          mountedRef.current &&
          accountIdRef.current === operation.accountId
        ) {
          toast.error(
            "Could not retire the stale top-up link — payment remains blocked",
          );
        }
      }
      bumpOperations();
    });
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Outlet Usage</span>
        <span className="text-xs text-muted-foreground">
          {outlets} / {planLimit} paid
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${extra > 0 ? "bg-destructive" : "gradient-mint"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {ownerOperationBlocking && (
        <div className="space-y-3">
          {extra > 0 && (
            <Button
              disabled
              size="sm"
              className="w-full gradient-mint text-primary-foreground h-9 text-xs"
            >
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              {preparingCurrentView
                ? "Preparing secure payment…"
                : `Pay for ${extra} extra outlet${extra > 1 ? "s" : ""}${subscription ? " (Annual rate)" : ""}`}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            {ownerStartOperation?.state === "cleanup_failed"
              ? "The previous top-up link is still payable. Retire it before starting another payment."
              : ownerStartOperation?.state === "retiring"
                ? "Retiring the previous top-up link before another payment can start…"
                : "Finishing the previous top-up request before another payment can start…"}
          </p>
          {failedOwnerStartOperation && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={retryStaleTopUpCleanup}
            >
              Retry retiring stale payment link
            </Button>
          )}
        </div>
      )}

      {!ownerOperationBlocking &&
        extra > 0 &&
        !canReopen &&
        !staleLinkWithId &&
        outletsHydrated && (
        <div className="space-y-3">
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {extra} outlet{extra > 1 ? "s" : ""} beyond your plan — they won't ingest until you pay for them.
          </p>
          <Button
            onClick={startTopUp}
            disabled={cancellationBlocking}
            size="sm"
            className="w-full gradient-mint text-primary-foreground hover:opacity-90 h-9 text-xs"
          >
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            {preparingCurrentView
              ? "Preparing secure payment…"
              : `Pay for ${extra} extra outlet${extra > 1 ? "s" : ""}${subscription ? " (Annual rate)" : ""}`}
          </Button>
        </div>
      )}

      {!ownerOperationBlocking && extra > 0 && canReopen && retainedLink && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Waiting for your top-up{retainedLink.amount ? ` of ₹${Number(retainedLink.amount).toLocaleString()}` : ""} — complete it in the Razorpay tab.
          </p>
          <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => window.open(retainedLink.shortUrl, "_blank", "noopener")}>
            <ExternalLink className="h-3 w-3 mr-1" /> Reopen payment page
          </Button>
        </div>
      )}

      {!ownerOperationBlocking && staleLinkWithId && retainedLink && (
        <div className="space-y-2">
          {extra > 0 && (
            <Button
              disabled
              size="sm"
              className="w-full gradient-mint text-primary-foreground h-9 text-xs"
            >
              Pay for {extra} extra outlet{extra > 1 ? "s" : ""}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            {cancelState === "checking_settlement"
              ? "Payment may have completed — refreshing paid capacity…"
              : cancelState === "failed"
                ? "The old top-up is still payable. Cancel it before repricing."
                : "Cancelling the stale top-up before repricing…"}
          </p>
          {cancelState === "failed" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => void cancelRetainedLink(retainedLink, true)}
            >
              Retry cancelling old payment link
            </Button>
          )}
        </div>
      )}

      {!ownerOperationBlocking &&
        extra === 0 &&
        planLimit > 0 &&
        outlets === planLimit &&
        !retainedLink && (
        <p className="text-xs text-primary flex items-center gap-1">
          <Check className="h-3 w-3" /> All outlets covered by your plan
        </p>
      )}
    </div>
  );
}

/* ── Platform badge ── */
function PlatformBadge({ platform }: { platform: "zomato" | "swiggy" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase ${
        platform === "zomato"
          ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/20"
          : "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/20"
      }`}
    >
      {platform}
    </span>
  );
}

/* ══════════════════════════════════════════
   STEP 1: Create Outlets
   ══════════════════════════════════════════ */
function CreateOutlets({
  reload,
  outletsHydrated,
}: {
  reload: () => Promise<void>;
  outletsHydrated: boolean;
}) {
  const { data } = useOnboarding();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const addOutlet = async () => {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      await api.post("/me/onboarding/outlets", { name: newName.trim() });
      setNewName("");
      await reload();
    } catch (err) {
      surface(err, "Could not add the outlet");
    } finally {
      setBusy(false);
    }
  };

  const removeOutlet = async (o: Outlet) => {
    setBusy(true);
    try {
      // Free its platform IDs (they return to the detected list), then retire it.
      if (o.zomatoId) await api.del(`/me/onboarding/outlets/${o.id}/platform-ids/zomato`);
      if (o.swiggyId) await api.del(`/me/onboarding/outlets/${o.id}/platform-ids/swiggy`);
      await api.patch(`/me/onboarding/outlets/${o.id}`, { status: "Inactive" });
      await reload();
    } catch (err) {
      surface(err, "Could not remove the outlet");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <BillingCounter
        outlets={data.outlets.length}
        outletsHydrated={outletsHydrated}
      />

      {/* Add outlet input */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          Add Outlets
        </h3>
        <div className="flex gap-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter outlet name (e.g. Koramangala Branch)..."
            className="bg-secondary/70 border-border h-11 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addOutlet()}
          />
          <Button
            onClick={addOutlet}
            disabled={!newName.trim() || busy}
            className="gradient-mint text-primary-foreground hover:opacity-90 h-11 px-5 shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add
          </Button>
        </div>
      </div>

      {/* Outlet cards */}
      {data.outlets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.outlets.map((o, i) => (
            <div
              key={o.id}
              className="group relative glass-card rounded-xl p-4 hover:border-primary/30 transition-all duration-200"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <button
                onClick={() => removeOutlet(o)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${o.name}`}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg gradient-mint flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {o.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{o.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.zomatoId || o.swiggyId ? "IDs linked" : "No IDs yet"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Store className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No outlets yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add your first outlet above to get started</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 2: Link Platform IDs
   ══════════════════════════════════════════ */
function LinkPlatformIds({ reload }: { reload: () => Promise<void> }) {
  const { data } = useOnboarding();
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "zomato" | "swiggy">("all");
  const [busy, setBusy] = useState(false);

  const unassigned = data.detectedRestaurants.filter((r) => {
    if (r.assignedOutletId) return false;
    if (platformFilter !== "all" && r.platform !== platformFilter) return false;
    if (search && !r.platformId.includes(search) && !r.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const assignToOutlet = async (restaurantId: string, outletId: string) => {
    const restaurant = data.detectedRestaurants.find((r) => r.id === restaurantId);
    if (!restaurant || busy) return;
    setBusy(true);
    try {
      await api.post(`/me/onboarding/outlets/${outletId}/platform-ids`, {
        platform: restaurant.platform,
        resId: restaurant.platformId,
      });
      await reload();
    } catch (err) {
      surface(err, "Could not link that ID");
    } finally {
      setBusy(false);
    }
  };

  const unlinkFromOutlet = async (outletId: string, platform: "zomato" | "swiggy") => {
    if (busy) return;
    setBusy(true);
    try {
      await api.del(`/me/onboarding/outlets/${outletId}/platform-ids/${platform}`);
      await reload();
    } catch (err) {
      surface(err, "Could not unlink that ID");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {unassigned.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/15 text-sm">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{unassigned.length} platform ID{unassigned.length > 1 ? "s" : ""} ready to link</p>
            <p className="text-muted-foreground text-xs mt-0.5">Select an outlet for each detected ID below.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Unassigned IDs */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Detected IDs
          </h3>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-secondary/70 border-border h-9 pl-9 text-xs"
              />
            </div>
            <div className="flex rounded-lg overflow-hidden border border-border">
              {(["all", "zomato", "swiggy"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setPlatformFilter(f)}
                  className={`px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                    platformFilter === f
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {unassigned.map((r) => (
              <div
                key={r.id}
                className="glass-card rounded-xl p-3 flex items-center justify-between gap-2 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <PlatformBadge platform={r.platform} />
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-foreground">{r.platformId}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{r.name}</p>
                  </div>
                </div>
                {data.outlets.length > 0 && (() => {
                  // Only show outlets that don't already have this platform's ID (1:1 enforcement)
                  const availableOutlets = data.outlets.filter((o) =>
                    r.platform === "zomato" ? !o.zomatoId : !o.swiggyId
                  );
                  return availableOutlets.length > 0 ? (
                    <select
                      onChange={(e) => {
                        if (e.target.value) assignToOutlet(r.id, e.target.value);
                      }}
                      defaultValue=""
                      disabled={busy}
                      className="bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-foreground w-[150px] shrink-0 cursor-pointer focus:ring-1 focus:ring-primary/40 focus:outline-none"
                    >
                      <option value="">Link to →</option>
                      {availableOutlets.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50 italic">All outlets have {r.platform} ID</span>
                  );
                })()}
              </div>
            ))}
            {unassigned.length === 0 && (
              <div className="text-center py-8">
                <Check className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">All IDs linked!</p>
              </div>
            )}
          </div>
        </div>

        {/* Center arrow */}
        <div className="hidden lg:flex items-center justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
        </div>

        {/* Right: Outlets with linked IDs */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            Your Outlets
          </h3>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {data.outlets.map((o) => (
              <div key={o.id} className="glass-card rounded-xl p-4 space-y-3 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg gradient-mint flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {o.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{o.name}</span>
                </div>

                <div className="space-y-1.5">
                  {/* Zomato ID */}
                  <div className="flex items-center justify-between">
                    {o.zomatoId ? (
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform="zomato" />
                        <span className="text-xs font-mono text-foreground">{o.zomatoId}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 flex items-center gap-1.5">
                        <Unlink className="h-3 w-3" /> No Zomato ID
                      </span>
                    )}
                    {o.zomatoId && (
                      <button
                        onClick={() => unlinkFromOutlet(o.id, "zomato")}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Unlink Zomato ID from ${o.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Swiggy ID */}
                  <div className="flex items-center justify-between">
                    {o.swiggyId ? (
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform="swiggy" />
                        <span className="text-xs font-mono text-foreground">{o.swiggyId}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 flex items-center gap-1.5">
                        <Unlink className="h-3 w-3" /> No Swiggy ID
                      </span>
                    )}
                    {o.swiggyId && (
                      <button
                        onClick={() => unlinkFromOutlet(o.id, "swiggy")}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Unlink Swiggy ID from ${o.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {data.outlets.length === 0 && (
              <div className="text-center py-8">
                <Store className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Go back and create outlets first</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 3: Brand & Group
   ══════════════════════════════════════════ */
function BrandGroupMapping({ reload }: { reload: () => Promise<void> }) {
  const { data, updateData } = useOnboarding();

  // An option added in quick fill isn't on any outlet yet, so it exists nowhere
  // else — hold it here so it can still be picked from each outlet's dropdown.
  const [addedBrands, setAddedBrands] = useState<string[]>([]);
  const [addedGroups, setAddedGroups] = useState<string[]>([]);

  const brandOptions = [
    ...new Set([...data.outlets.map((o) => o.brand).filter(Boolean), ...addedBrands]),
  ] as string[];
  const groupOptions = [
    ...new Set([...data.outlets.map((o) => o.group).filter(Boolean), ...addedGroups]),
  ] as string[];

  // Picking from the dropdown writes straight through — there's no blur to wait
  // for. An empty value clears it: UC maps brand '' → null (no junk Brand row)
  // and group_name '' → empty, so "None" is a real, persisted choice.
  const setField = async (outlet: Outlet, field: "brand" | "group", value: string) => {
    updateData({
      outlets: data.outlets.map((o) => (o.id === outlet.id ? { ...o, [field]: value } : o)),
    });
    try {
      await api.patch(
        `/me/onboarding/outlets/${outlet.id}`,
        field === "brand" ? { brand: value } : { group_name: value },
      );
    } catch (err) {
      surface(err, "Could not save brand/group");
      await reload(); // server is the truth — undo the optimistic write
    }
  };

  const [quickBrand, setQuickBrand] = useState("");
  const [quickGroup, setQuickGroup] = useState("");

  const addOption = (field: "brand" | "group", value: string) => {
    const v = value.trim();
    if (!v) return;
    const [options, setAdded] =
      field === "brand" ? [brandOptions, setAddedBrands] : [groupOptions, setAddedGroups];
    if (options.some((o) => o.toLowerCase() === v.toLowerCase())) {
      toast.info(`"${v}" is already an option`);
      return;
    }
    (setAdded as (fn: (prev: string[]) => string[]) => void)((prev) => [...prev, v]);
    toast.success(`"${v}" added — pick it from any outlet's dropdown`);
  };

  // Removing an option has to clear it off the outlets using it too: the option
  // list is derived from the outlets' own values, so dropping it from `added`
  // alone would just let it reappear on the next render.
  const removeOption = async (field: "brand" | "group", value: string) => {
    const setAdded = field === "brand" ? setAddedBrands : setAddedGroups;
    const inUse = data.outlets.filter((o) => o[field] === value);

    setAdded((prev) => prev.filter((v) => v !== value));
    if (inUse.length === 0) {
      toast.success(`Removed "${value}"`);
      return;
    }
    try {
      await Promise.all(
        inUse.map((o) =>
          api.patch(`/me/onboarding/outlets/${o.id}`, field === "brand" ? { brand: "" } : { group_name: "" }),
        ),
      );
      await reload();
      toast.success(`Removed "${value}" — cleared from ${inUse.length} outlet${inUse.length > 1 ? "s" : ""}`);
    } catch (err) {
      surface(err, `Could not remove "${value}"`);
      await reload(); // server is the truth — put the option back if it's still in use
    }
  };

  // Bulk convenience: put the option on every outlet that has no value yet.
  const applyToAll = async (field: "brand" | "group", value: string) => {
    const v = value.trim();
    if (!v) return;
    const targets = data.outlets.filter((o) => !o[field]);
    if (targets.length === 0) {
      toast.info("Every outlet already has one — pick from the dropdowns to change them.");
      return;
    }
    try {
      await Promise.all(
        targets.map((o) =>
          api.patch(`/me/onboarding/outlets/${o.id}`, field === "brand" ? { brand: v } : { group_name: v }),
        ),
      );
      await reload();
    } catch (err) {
      surface(err, "Could not apply to all outlets");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Brand & Group Mapping</h3>
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Brand</strong> = same menu/brand across locations.{" "}
          <strong className="text-foreground">Group</strong> = any logical cluster (city, franchise owner, etc).
        </p>
      </div>

      {/* Quick fill — define the options once, then pick them per outlet. */}
      {data.outlets.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <p className="text-xs font-medium text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Quick fill — add a brand or group, then pick it from any outlet's dropdown
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              { field: "brand", label: "Brand", value: quickBrand, set: setQuickBrand, options: brandOptions },
              { field: "group", label: "Group", value: quickGroup, set: setQuickGroup, options: groupOptions },
            ] as const).map(({ field, label, value, set, options }) => (
              <div key={field} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addOption(field, value);
                        set("");
                      }
                    }}
                    placeholder={`${label} name`}
                    className="bg-secondary/70 border-border h-9 text-xs"
                  />
                  <Button
                    size="sm"
                    className="h-9 text-xs shrink-0 gradient-mint text-primary-foreground hover:opacity-90"
                    disabled={!value.trim()}
                    onClick={() => {
                      addOption(field, value);
                      set("");
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs shrink-0"
                    disabled={!value.trim()}
                    title={`Set this ${label.toLowerCase()} on every outlet that has none`}
                    onClick={() => {
                      addOption(field, value);
                      applyToAll(field, value);
                      set("");
                    }}
                  >
                    Apply to all
                  </Button>
                </div>
                {options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {options.map((o) => {
                      const used = data.outlets.filter((x) => x[field] === o).length;
                      return (
                        <span
                          key={o}
                          className="group inline-flex items-center gap-1 rounded-md bg-secondary pl-2 pr-1 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border"
                        >
                          {o}
                          {used > 0 && <span className="text-primary/70">· {used}</span>}
                          <button
                            type="button"
                            onClick={() => removeOption(field, o)}
                            aria-label={
                              used > 0
                                ? `Remove ${label.toLowerCase()} ${o} (clears it from ${used} outlet${used > 1 ? "s" : ""})`
                                : `Remove ${label.toLowerCase()} ${o}`
                            }
                            title={
                              used > 0
                                ? `Remove — also clears it from ${used} outlet${used > 1 ? "s" : ""}`
                                : "Remove"
                            }
                            className="rounded p-0.5 text-muted-foreground/60 hover:bg-destructive/15 hover:text-destructive transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-outlet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.outlets.map((o) => (
          <div key={o.id} className="glass-card rounded-xl p-4 space-y-3 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg gradient-mint flex items-center justify-center text-primary-foreground text-xs font-bold">
                {o.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{o.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { field: "brand", label: "Brand", value: o.brand, options: brandOptions },
                { field: "group", label: "Group", value: o.group, options: groupOptions },
              ] as const).map(({ field, label, value, options }) => (
                <div key={field} className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{label}</Label>
                  <select
                    value={value ?? ""}
                    onChange={(e) => setField(o, field, e.target.value)}
                    aria-label={`${label} for ${o.name}`}
                    disabled={options.length === 0}
                    className="w-full bg-secondary/70 border border-border rounded-md h-8 px-2 text-xs text-foreground cursor-pointer focus:ring-1 focus:ring-primary/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {options.length === 0 ? `Add a ${label.toLowerCase()} above` : "None"}
                    </option>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 4: Review & Confirm
   ══════════════════════════════════════════ */
function ReviewConfirm() {
  const { data, paidOutletCount } = useOnboarding();
  const zomatoLinked = data.outlets.filter((o) => o.zomatoId).length;
  const swiggyLinked = data.outlets.filter((o) => o.swiggyId).length;

  const stats = [
    { label: "Total Outlets", value: data.outlets.length, color: "text-foreground" },
    { label: "Zomato Linked", value: zomatoLinked, color: "text-red-400" },
    { label: "Swiggy Linked", value: swiggyLinked, color: "text-orange-400" },
    { label: "Paid Outlets", value: paidOutletCount, color: "text-foreground" },
    {
      label: "Remaining",
      value: Math.max(0, paidOutletCount - data.outlets.length),
      color: "text-primary",
    },
    { label: "Historic Data", value: `${data.historicMonths}mo`, color: "text-foreground" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4 text-center">
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Outlet table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Outlet</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Zomato</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Swiggy</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Brand</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Group</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.outlets.map((o) => (
                <tr key={o.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md gradient-mint flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                        {o.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground text-xs">{o.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {o.zomatoId ? (
                      <span className="text-red-400">{o.zomatoId}</span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {o.swiggyId ? (
                      <span className="text-orange-400">{o.swiggyId}</span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-foreground">{o.brand || <span className="text-muted-foreground/30">—</span>}</td>
                  <td className="py-3 px-4 text-xs text-foreground">{o.group || <span className="text-muted-foreground/30">—</span>}</td>
                  <td className="py-3 px-4">
                    {o.zomatoId || o.swiggyId ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        <Check className="h-2.5 w-2.5 mr-1" /> Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                        No IDs
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */
export default function OutletMapping() {
  const { accountId, outletStep, updateData } = useOnboarding();
  const { load } = useOutlets();
  const [outletHydration, setOutletHydration] =
    useState<{
      status: "loading" | "ready" | "failed";
      accountId: number | null;
      requestVersion: number;
    }>({
      status: "loading",
      accountId,
      requestVersion: 0,
    });
  const loadVersionRef = useRef(0);
  const accountIdRef = useRef(accountId);
  accountIdRef.current = accountId;
  const outletsHydrated =
    outletHydration.status === "ready" &&
    outletHydration.accountId === accountId &&
    outletHydration.requestVersion === loadVersionRef.current;
  const outletHydrationFailed =
    outletHydration.status === "failed" &&
    outletHydration.accountId === accountId;

  const reloadOutlets = useCallback(async () => {
    const loadAccountId = accountId;
    if (accountIdRef.current !== loadAccountId) return;
    const loadVersion = ++loadVersionRef.current;
    setOutletHydration({
      status: "loading",
      accountId: loadAccountId,
      requestVersion: loadVersion,
    });
    try {
      const loaded = await load();
      if (
        loadVersionRef.current !== loadVersion ||
        accountIdRef.current !== loadAccountId
      ) {
        return;
      }
      updateData(loaded);
      setOutletHydration({
        status: "ready",
        accountId: loadAccountId,
        requestVersion: loadVersion,
      });
    } catch (err) {
      // A failed fetch is not confirmation that there are zero outlets. Keep
      // payment identity actions gated until a later successful reload.
      if (
        loadVersionRef.current !== loadVersion ||
        accountIdRef.current !== loadAccountId
      ) {
        return;
      }
      setOutletHydration({
        status: "failed",
        accountId: loadAccountId,
        requestVersion: loadVersion,
      });
      throw err;
    }
  }, [accountId, load, updateData]);

  // Server state is the truth — hydrate on entry and re-sync between substeps.
  useEffect(() => {
    reloadOutlets().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, outletStep]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Outlet Mapping</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Create outlets and link your platform IDs for accurate reporting.
        </p>
      </div>

      <StepProgress step={outletStep} />

      {outletHydrationFailed && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            We could not load your outlets. Payment actions stay paused until
            the outlet list is confirmed.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void reloadOutlets().catch(() => {})}
          >
            Retry loading outlets
          </Button>
        </div>
      )}

      {outletStep === 0 && (
        <CreateOutlets
          reload={reloadOutlets}
          outletsHydrated={outletsHydrated}
        />
      )}
      {outletStep === 1 && <LinkPlatformIds reload={reloadOutlets} />}
      {outletStep === 2 && <BrandGroupMapping reload={reloadOutlets} />}
      {outletStep === 3 && <ReviewConfirm />}
    </div>
  );
}

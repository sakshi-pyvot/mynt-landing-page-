import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface DetectedRestaurant {
  id: string;
  platformId: string;
  platform: "zomato" | "swiggy";
  name: string;
  mailbox: string;
  assignedOutletId?: string;
  /** From DIP discovery: the outlet this res-id is already mapped to, if any. */
  mappedOutletName?: string;
}

export interface Outlet {
  id: string;
  name: string;
  zomatoId?: string;
  swiggyId?: string;
  brand: string;
  group: string;
}

export interface ConnectedEmail {
  id: string;
  email: string;
  provider: "gmail" | "outlook";
  selected: boolean;
  zomatoFound: boolean;
  swiggyFound: boolean;
  attachmentsFound: boolean;
  status: "connected" | "disconnected" | "syncing";
  lastSync?: string;
}

/** UC's canonical plan codes — the same enum the admin flow bills with. */
export type PlanCode = "Monthly" | "Quarterly" | "Half-Yearly" | "Annual";
export const FIXED_PLAN: PlanCode = "Annual";
export const FIXED_DURATION_MONTHS = 12 as const;
export const FIXED_HISTORIC_MONTHS = 12 as const;

export interface OnboardingData {
  // Page 0 — Business
  profileName: string;
  companyName: string;
  numberOfRestaurants: number;
  cities: string;
  platformsUsed: "zomato" | "swiggy" | "both";
  financeEmail: string;
  whatsappNumber: string;
  gstin: string;
  gstinConfirmed: boolean;
  /**
   * The name on the GST register, captured when the customer confirms a
   * verified GSTIN. A B2B tax invoice must carry the REGISTERED name — UC's
   * invoiceService renders `account.legalEntityName || account.name`, and
   * UC's promotion path reads this off the onboarding blob.
   *
   * Kept in step with companyName rather than shown separately: the Payment
   * screen has ONE name box, bound to companyName, and writes both fields
   * from it. Cleared with the GSTIN, because the registered name for tax
   * purposes belongs to the number — the fallback above then resolves to
   * companyName, which is what that box is showing.
   */
  legalEntityName: string;
  billingAddress: string;
  billingStateCode: string;
  // Page 1 — Plan
  planDuration: PlanCode;
  historicMonths: 3 | 6 | 12 | 24;
  // Page 3 — Email
  connectedEmails: ConnectedEmail[];
  emailStep: number;
  // Page 4 — Detection
  detectedRestaurants: DetectedRestaurant[];
  /** Wizard Continue gate: stay disabled until scan finishes with results. */
  detectionScanState: "idle" | "scanning" | "done" | "failed";
  // Page 5 — Outlets
  outlets: Outlet[];
}

export interface OnboardingSubscription {
  id: string;
  plan: string;
  outletCount: number;
  durationMonths: number;
  historicDataMonths: number;
  totalAmount: string;
  status: string;
}

export interface OnboardingPayment {
  status: string | null;
  shortUrl: string | null;
  paidAt: string | null;
  paymentLinkId?: string | null;
  subscriptionId?: string | null;
  expiresAt?: string | null;
}

/** The /me/onboarding resume payload UC serves (SCRUM-72). */
interface ServerState {
  accountId: number;
  /** Paid capacity: base plan + settled top-ups (sum of active subscriptions). */
  paidOutletCount: number;
  stage: "draft" | "paid" | "email_connected" | "outlets_mapped" | "live";
  currentStep: number;
  business: Partial<{
    profileName: string;
    companyName: string;
    numberOfRestaurants: number;
    cities: string;
    platformsUsed: "zomato" | "swiggy" | "both";
    financeEmail: string;
    whatsappNumber: string;
    gstin: string;
    gstinConfirmed: boolean;
    legalEntityName: string;
    billingAddress: string;
    billingStateCode: string;
  }>;
  plan: Partial<{ plan: PlanCode; outletCount: number; historicMonths: 3 | 6 | 12 | 24 }>;
  subscription: OnboardingSubscription | null;
  payment: OnboardingPayment | null;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
  currentPage: number;
  /** Moves the wizard AND persists progress to UC (refresh-safe resume). */
  setCurrentPage: (page: number) => void;
  outletStep: number;
  setOutletStep: (step: number) => void;
  /** True until the server resume state has hydrated. */
  loading: boolean;
  stage: ServerState["stage"];
  accountId: number | null;
  paidOutletCount: number;
  subscription: ServerState["subscription"];
  payment: ServerState["payment"];
  /** Re-pull server state (payment polling, post-action refresh). */
  refresh: () => Promise<ServerState>;
  /**
   * PATCHes the CURRENT in-memory data to the server on demand, without
   * moving the resume pointer. Normally only a page transition persists —
   * callers that are about to trigger a refresh() from elsewhere (payment
   * settlement, a websocket nudge, the passive poll) must persist first, or
   * applyServerState will spread the server's stale blob back over any
   * locally-dirty edit and silently erase it.
   */
  persist: () => Promise<void>;
}

const defaultData: OnboardingData = {
  profileName: "",
  companyName: "",
  numberOfRestaurants: 1,
  cities: "",
  platformsUsed: "both",
  financeEmail: "",
  whatsappNumber: "",
  gstin: "",
  gstinConfirmed: false,
  legalEntityName: "",
  billingAddress: "",
  billingStateCode: "",
  planDuration: FIXED_PLAN,
  historicMonths: FIXED_HISTORIC_MONTHS,
  connectedEmails: [],
  emailStep: 0,
  detectedRestaurants: [],
  detectionScanState: "idle",
  outlets: [],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/**
 * The tax-decisive fields. Anything in here decides CGST+SGST vs IGST on a
 * legal document, or whose name is printed on it — so a server echo must
 * never win over what the customer has just typed.
 *
 * companyName qualifies on the second count. It is the funnel's one name
 * field, the GST register writes into it when a GSTIN is confirmed, and
 * invoiceService falls through to it (`account.legalEntityName ||
 * account.name`). Without it here, the Payment screen's 4s awaiting-payment
 * poll spreads the server's stale name back over a just-confirmed register
 * name within four seconds — and the customer, who is paying in the other
 * tab, never sees the invoice it produces.
 */
const IDENTITY_FIELDS = [
  "gstin",
  "gstinConfirmed",
  "companyName",
  "legalEntityName",
  "billingAddress",
  "billingStateCode",
] as const satisfies readonly (keyof OnboardingData)[];

type IdentityField = (typeof IDENTITY_FIELDS)[number];

const toServer = (d: OnboardingData) => ({
  business: {
    profileName: d.profileName,
    companyName: d.companyName,
    numberOfRestaurants: d.numberOfRestaurants,
    cities: d.cities,
    platformsUsed: "both" as const,
    financeEmail: d.financeEmail,
    whatsappNumber: d.whatsappNumber,
    gstin: d.gstin,
    gstinConfirmed: d.gstinConfirmed,
    // UC's promotion path reads legalEntityName off this blob; leave it out
    // and the registered name is dropped on save and lost on refresh.
    legalEntityName: d.legalEntityName,
    billingAddress: d.billingAddress,
    billingStateCode: d.billingStateCode,
  },
  plan: {
    plan: FIXED_PLAN,
    outletCount: d.numberOfRestaurants,
    historicMonths: FIXED_HISTORIC_MONTHS,
  },
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [currentPage, setCurrentPageState] = useState(0);
  const [outletStep, setOutletStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [paidOutletCount, setPaidOutletCount] = useState(0);
  const [stage, setStage] = useState<ServerState["stage"]>("draft");
  const [subscription, setSubscription] = useState<ServerState["subscription"]>(null);
  const [payment, setPayment] = useState<ServerState["payment"]>(null);

  // setState closures don't see the latest data at persist time — mirror it.
  const dataRef = useRef(data);
  dataRef.current = data;

  // 404 = the token's user has no UC account (stale/deleted session). Retrying
  // can never succeed and every save silently vanishes — force a clean re-login.
  const dropDeadSession = (e: unknown) => {
    if (e instanceof ApiError && e.status === 404) logout();
  };

  /**
   * Identity fields the customer has edited in THIS session. refresh() is
   * called from places that are nowhere near a save — the payment screen's
   * 4s passive poll, the `payment.settled` websocket nudge, the reconcile
   * ticker — and every one of them lands in applyServerState, which spreads
   * the server's business blob over local state. On the awaiting-payment
   * screen the identity card is still editable while the Pay button (the
   * only persist() call site there) is gone, so without this an edit made
   * there was destroyed within 4 seconds.
   *
   * Sticky for the life of the provider on purpose: clearing it when a save
   * resolves re-opens the same hole for anything typed while that save was
   * still on the wire.
   */
  const locallyEditedIdentityRef = useRef(new Set<IdentityField>());

  const applyServerState = (s: ServerState) => {
    setAccountId(s.accountId);
    setPaidOutletCount(s.paidOutletCount ?? 0);
    setStage(s.stage);
    setSubscription(s.subscription);
    setPayment(s.payment);
    const serverBusiness = { ...s.business };
    for (const field of locallyEditedIdentityRef.current) delete serverBusiness[field];
    setData((prev) => ({
      ...prev,
      ...serverBusiness,
      platformsUsed: "both",
      planDuration: FIXED_PLAN,
      historicMonths: FIXED_HISTORIC_MONTHS,
    }));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    api
      .get<ServerState>("/me/onboarding")
      .then((s) => {
        applyServerState(s);
        setCurrentPageState(Math.min(Math.max(s.currentStep ?? 0, 0), 5));
      })
      .catch(dropDeadSession) // other failures: fresh wizard — nothing to resume
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const refresh = async () => {
    const s = await api.get<ServerState>("/me/onboarding");
    applyServerState(s);
    return s;
  };

  const persist = async () => {
    await api.patch("/me/onboarding", { currentStep: currentPage, ...toServer(dataRef.current) });
  };

  const updateData = (partial: Partial<OnboardingData>) => {
    // updateData is only ever reached from a UI handler — server hydration
    // goes through applyServerState — so a key present here is by definition
    // the customer's own value and outranks anything the server sends back.
    for (const field of IDENTITY_FIELDS) {
      if (field in partial) locallyEditedIdentityRef.current.add(field);
    }
    setData((prev) => ({
      ...prev,
      ...partial,
      platformsUsed: "both",
      planDuration: FIXED_PLAN,
      historicMonths: FIXED_HISTORIC_MONTHS,
    }));
  };

  // Step transitions are the save points: persist drafts + the resume pointer.
  const setCurrentPage = (page: number) => {
    setCurrentPageState(page);
    api.patch("/me/onboarding", { currentStep: page, ...toServer(dataRef.current) }).catch(dropDeadSession);
    // non-404 failures stay best-effort — the next transition retries with the full state
  };

  return (
    <OnboardingContext.Provider
      value={{ data, updateData, currentPage, setCurrentPage, outletStep, setOutletStep, loading, stage, accountId, paidOutletCount, subscription, payment, refresh, persist }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}

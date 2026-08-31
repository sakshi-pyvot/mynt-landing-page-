import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Building2, CreditCard, Wallet, Mail, MapPin, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BusinessDetails from "./onboarding/BusinessDetails";
import PlanPricing from "./onboarding/PlanPricing";
import Payment from "./onboarding/Payment";
import ConnectEmail from "./onboarding/ConnectEmail";
import RestaurantDetection from "./onboarding/RestaurantDetection";
import OutletMapping from "./onboarding/OutletMapping";

const PAGE_LABELS = ["Business", "Plan", "Payment", "Email", "Detect", "Map Outlets"];
const PAGE_ICONS = [Building2, CreditCard, Wallet, Mail, Mail, MapPin];

function OnboardingContent() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentPage, setCurrentPage, data, stage, outletStep, setOutletStep, loading } = useOnboarding();
  const [confirming, setConfirming] = useState(false);
  const totalPages = 6;

  // Server resume state hydrating — don't flash page 0 before it lands.
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading your progress…</span>
      </div>
    );
  }

  const canNext = () => {
    if (currentPage === 0) return data.profileName.trim() && data.companyName.trim() && data.numberOfRestaurants > 0;
    if (currentPage === 2) return stage !== "draft"; // payment must have landed
    if (currentPage === 3) return data.connectedEmails.length > 0;
    if (currentPage === 4) {
      return data.detectionScanState === "done" && data.detectedRestaurants.length > 0;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentPage === 5) {
      if (outletStep < 3) {
        setOutletStep(outletStep + 1);
        return;
      }
      // Final confirm — UC validates the mapping and runs the auto-go-live rule.
      setConfirming(true);
      try {
        const r = await api.post<{ live: boolean; warnings: string[] }>("/me/onboarding/outlets/confirm", {});
        r.warnings?.forEach((w) => toast.warning(w));
        navigate("/processing");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not confirm the mapping — try again");
      } finally {
        setConfirming(false);
      }
      return;
    }
    setCurrentPage(currentPage + 1);
  };

  const handleBack = () => {
    if (currentPage === 5 && outletStep > 0) {
      setOutletStep(outletStep - 1);
      return;
    }
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const buttonLabel = () => {
    if (currentPage === 5 && outletStep === 3) return "Confirm & Start Processing";
    if (currentPage === 5) return "Next Step";
    return "Continue";
  };

  const showFooterNext = true;

  // Detect (4) and Outlet Mapping (5) are data-dense — two side-by-side panels,
  // a six-column review table, long IDs and outlet names. At max-w-4xl each
  // panel got ~330px, which truncated every outlet name and left the rest of
  // the row empty. The earlier steps are short forms and read better narrow, so
  // widen only where the content actually needs it.
  const contentWidth = currentPage >= 4 ? "max-w-6xl" : "max-w-4xl";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gradient-mint">mynt</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
                {currentPage === 5 && ` · Step ${outletStep + 1}/4`}
              </span>
              <span className="hidden sm:block text-xs text-muted-foreground border-l border-border pl-3">{user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                title="Wrong account? Log out and sign in with the right one."
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" /> Log out
              </Button>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= currentPage ? "gradient-mint" : "bg-secondary"}`} />
            ))}
          </div>
          <div className="flex justify-between mt-3">
            {PAGE_LABELS.map((label, i) => {
              const Icon = PAGE_ICONS[i];
              return (
                <div key={`${label}-${i}`} className={`flex flex-col items-center gap-1 ${i <= currentPage ? "text-primary" : "text-muted-foreground/40"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] hidden sm:block">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 container ${contentWidth} py-8 px-4`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPage}-${outletStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentPage === 0 && <BusinessDetails />}
            {currentPage === 1 && <PlanPricing />}
            {currentPage === 2 && <Payment />}
            {currentPage === 3 && <ConnectEmail />}
            {currentPage === 4 && <RestaurantDetection />}
            {currentPage === 5 && <OutletMapping />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card/50 backdrop-blur-xl sticky bottom-0">
        <div className={`container ${contentWidth} py-4 flex justify-between`}>
          <Button variant="ghost" onClick={handleBack} disabled={currentPage === 0 && outletStep === 0} className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {showFooterNext && (
            <Button onClick={handleNext} disabled={!canNext() || confirming} className="gradient-mint text-primary-foreground hover:opacity-90 px-6">
              {confirming ? "Confirming…" : buttonLabel()}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}

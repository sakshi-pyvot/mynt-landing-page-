import { useEffect, useState } from "react";
import { FIXED_PLAN, useOnboarding } from "@/contexts/OnboardingContext";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Prices come from UC's pricing engine (SCRUM-72) — the SAME sheet the admin
// panel bills with; nothing is computed client-side.

interface Preview {
  gross: number;
  discount: number;
  discountPct: number;
  gstAmount: number;
  totalAmount: number;
  durationMonths: number;
  unitPrice: number;
}

export default function PlanPricing() {
  const { data, updateData } = useOnboarding();
  const [unitPrice, setUnitPrice] = useState(500);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    api
      .get<{ unitPrice: number }>("/public/pricing/plans")
      .then((r) => {
        setUnitPrice(r.unitPrice);
      })
      .catch(() => setUnitPrice(500));
  }, []);

  useEffect(() => {
    api
      .get<Preview>(`/public/pricing/preview?plan=${FIXED_PLAN}&outlets=${data.numberOfRestaurants}`)
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [data.numberOfRestaurants]);

  const months = preview?.durationMonths ?? 1;
  const perMonth = preview ? Math.round(preview.totalAmount / months) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Plan & Pricing</h2>
        <p className="text-muted-foreground mt-1">Review your fixed Annual subscription price.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Inputs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Number of Restaurants</Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateData({ numberOfRestaurants: Math.max(1, data.numberOfRestaurants - 1) })}
                className="w-10 h-10 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 flex items-center justify-center text-lg"
              >−</button>
              <Input
                type="number" min={1}
                value={data.numberOfRestaurants}
                onChange={(e) => updateData({ numberOfRestaurants: Math.max(1, parseInt(e.target.value) || 1) })}
                className="bg-secondary border-border h-11 w-24 text-center"
              />
              <button
                onClick={() => updateData({ numberOfRestaurants: data.numberOfRestaurants + 1 })}
                className="w-10 h-10 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 flex items-center justify-center text-lg"
              >+</button>
            </div>
          </div>

        </div>

        {/* Right - Price Box */}
        <div className="glass-card rounded-2xl p-6 space-y-4 h-fit lg:sticky lg:top-24">
          <h3 className="text-lg font-semibold text-foreground">Price Breakdown</h3>

          {preview ? (
            <>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Base ({data.numberOfRestaurants} × ₹{unitPrice}/mo × {months} mo)
                  </span>
                  <span className="text-foreground">₹{preview.gross.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes (18% GST)</span>
                  <span className="text-foreground">₹{preview.gstAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground text-sm">Total for {months} month{months > 1 ? "s" : ""}</span>
                  <span className="text-2xl font-bold text-gradient-mint">₹{preview.totalAmount.toLocaleString()}</span>
                </div>
                {months > 1 && perMonth != null && (
                  <div className="flex justify-between mt-1 text-sm">
                    <span className="text-muted-foreground">Effective per month</span>
                    <span className="text-foreground font-semibold">₹{perMonth.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading prices…</p>
          )}
        </div>
      </div>
    </div>
  );
}

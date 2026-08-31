import { useOnboarding } from "@/contexts/OnboardingContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BusinessDetails() {
  const { data, updateData } = useOnboarding();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Business Details</h2>
        <p className="text-muted-foreground mt-1">This helps us set up your workspace and calculate pricing.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Profile Name <span className="text-destructive">*</span></Label>
          <Input
            value={data.profileName}
            onChange={(e) => updateData({ profileName: e.target.value })}
            placeholder="e.g. Rajesh Kumar"
            className="bg-secondary border-border h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Company / Brand Name <span className="text-destructive">*</span></Label>
          <Input
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
            placeholder="e.g. Foodie Brands Pvt Ltd"
            className="bg-secondary border-border h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Number of Restaurants <span className="text-destructive">*</span></Label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateData({ numberOfRestaurants: Math.max(1, data.numberOfRestaurants - 1) })}
            className="w-10 h-10 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 flex items-center justify-center text-lg font-medium"
          >
            −
          </button>
          <Input
            type="number" min={1} max={200}
            value={data.numberOfRestaurants}
            onChange={(e) => updateData({ numberOfRestaurants: Math.max(1, parseInt(e.target.value) || 1) })}
            className="bg-secondary border-border h-11 w-24 text-center"
          />
          <button
            onClick={() => updateData({ numberOfRestaurants: data.numberOfRestaurants + 1 })}
            className="w-10 h-10 rounded-lg bg-secondary border border-border text-foreground hover:bg-secondary/80 flex items-center justify-center text-lg font-medium"
          >
            +
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cities <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          value={data.cities}
          onChange={(e) => updateData({ cities: e.target.value })}
          placeholder="e.g. Mumbai, Delhi, Kolkata"
          className="bg-secondary border-border h-11"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Finance Contact Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            type="email"
            value={data.financeEmail}
            onChange={(e) => updateData({ financeEmail: e.target.value })}
            placeholder="finance@company.com"
            className="bg-secondary border-border h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Reports WhatsApp Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            type="tel"
            value={data.whatsappNumber}
            onChange={(e) => updateData({ whatsappNumber: e.target.value })}
            placeholder="+91 98765 43210"
            className="bg-secondary border-border h-11"
          />
        </div>
      </div>
    </div>
  );
}

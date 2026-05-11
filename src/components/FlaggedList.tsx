import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlaggedIngredient {
  name: string;
  severity: "low" | "medium" | "high";
  concern: string;
}

interface FlaggedListProps {
  flagged: FlaggedIngredient[];
  category: "whole_food" | "processed";
}

const styles = {
  high: {
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    icon: ShieldAlert,
    label: "High risk",
  },
  medium: {
    badge: "bg-warning/15 text-warning border-warning/30",
    icon: AlertTriangle,
    label: "Caution",
  },
  low: {
    badge: "bg-primary/10 text-primary border-primary/30",
    icon: ShieldCheck,
    label: "Low",
  },
};

export const FlaggedList = ({ flagged, category }: FlaggedListProps) => {
  if (category === "whole_food" && flagged.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-success/20 bg-success/5 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="font-display font-semibold text-success">Whole food — no artificial ingredients detected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This appears to be a fresh or minimally processed food. No additive concerns.
          </p>
        </div>
      </div>
    );
  }

  if (flagged.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-gradient-card p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="font-display font-semibold">No concerning ingredients flagged</p>
          <p className="mt-1 text-sm text-muted-foreground">Looks clean based on the visible information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Flagged ingredients</h3>
        <span className="text-xs text-muted-foreground">{flagged.length} found</span>
      </div>
      <div className="space-y-2">
        {flagged.map((item, i) => {
          const style = styles[item.severity];
          const Icon = style.icon;
          return (
            <div
              key={`${item.name}-${i}`}
              className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-0.5 grid h-8 w-8 place-items-center rounded-lg border", style.badge)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-display font-semibold capitalize">{item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.concern}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    style.badge,
                  )}
                >
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

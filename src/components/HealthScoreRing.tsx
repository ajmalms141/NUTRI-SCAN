import { cn } from "@/lib/utils";

interface HealthScoreRingProps {
  score: number;
  verdict: string;
}

export const HealthScoreRing = ({ score, verdict }: HealthScoreRingProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  const tone =
    clamped >= 75
      ? "stroke-success"
      : clamped >= 55
      ? "stroke-primary"
      : clamped >= 35
      ? "stroke-warning"
      : "stroke-destructive";

  const verdictTone =
    clamped >= 75
      ? "text-success"
      : clamped >= 55
      ? "text-primary"
      : clamped >= 35
      ? "text-warning"
      : "text-destructive";

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className="relative h-32 w-32 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} className="stroke-secondary" strokeWidth="10" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            className={cn(tone, "transition-all duration-700")}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold">{clamped}</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Health Score</p>
        <p className={cn("mt-1 font-display text-2xl font-semibold capitalize", verdictTone)}>{verdict}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {clamped >= 75
            ? "Great choice — nutrient-dense and clean."
            : clamped >= 55
            ? "Decent option, mind the portion."
            : clamped >= 35
            ? "Treat occasionally, watch additives."
            : "Highly processed — limit intake."}
        </p>
      </div>
    </div>
  );
};

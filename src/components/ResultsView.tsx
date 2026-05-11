import { useState } from "react";
import { HealthScoreRing } from "./HealthScoreRing";
import { MacroGrid } from "./MacroGrid";
import { FlaggedList } from "./FlaggedList";
import { Pill, Sparkles, Info, Pencil, Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlternativesSuggester } from "./AlternativesSuggester";

export interface AnalysisResult {
  foodName: string;
  category: "whole_food" | "processed";
  confidence: number;
  servingDescription: string;
  healthScore: number;
  healthVerdict: string;
  nutrition: {
    calories: number;
    proteinG: number;
    carbsG: number;
    sugarG: number;
    fatG: number;
    saturatedFatG: number;
    fiberG: number;
    sodiumMg: number;
  };
  vitamins: { name: string; amount: string }[];
  flaggedIngredients: { name: string; severity: "low" | "medium" | "high"; concern: string }[];
  positives: string[];
  notes: string;
}

interface ResultsViewProps {
  result: AnalysisResult;
  onCorrection?: (correction: string) => void;
  isCorrecting?: boolean;
}

export const ResultsView = ({ result, onCorrection, isCorrecting }: ResultsViewProps) => {
  const [correction, setCorrection] = useState("");
  const submitCorrection = () => {
    if (!correction.trim() || !onCorrection) return;
    onCorrection(correction.trim());
  };
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {result.category === "processed" ? "Processed product" : "Whole food"} · {Math.round(result.confidence * 100)}% confidence
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{result.foodName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{result.servingDescription}</p>
        </div>
      </div>

      <HealthScoreRing score={result.healthScore} verdict={result.healthVerdict} />

      <MacroGrid nutrition={result.nutrition} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Sugar</p>
          <p className="mt-2 font-display text-xl font-bold">{Math.round(result.nutrition.sugarG)}g</p>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Sat. Fat</p>
          <p className="mt-2 font-display text-xl font-bold">{Math.round(result.nutrition.saturatedFatG)}g</p>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Sodium</p>
          <p className="mt-2 font-display text-xl font-bold">{Math.round(result.nutrition.sodiumMg)}mg</p>
        </div>
      </div>

      {result.vitamins?.length > 0 && (
        <section className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-semibold">Vitamins & minerals</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.vitamins.map((v, i) => (
              <span
                key={`${v.name}-${i}`}
                className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium"
              >
                <span className="text-foreground">{v.name}</span>
                <span className="ml-1.5 text-muted-foreground">{v.amount}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <FlaggedList flagged={result.flaggedIngredients} category={result.category} />

      {result.positives?.length > 0 && (
        <section className="rounded-2xl border border-success/20 bg-success/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-success" />
            <h3 className="font-display text-lg font-semibold text-success">What's good about this</h3>
          </div>
          <ul className="space-y-1.5 text-sm text-foreground/90">
            {result.positives.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-success">•</span>
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.notes && (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{result.notes}</p>
        </div>
      )}

      <AlternativesSuggester originalFood={result.foodName} originalHealthScore={result.healthScore} />

      {onCorrection && (
        <section className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-semibold">Something off? Correct me</h3>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Tell me what's wrong (e.g. "this is 2 servings, not 1" or "it's chicken biryani, not pulao") and I'll re-analyze.
          </p>
          <Textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Describe the mistake or add missing details…"
            maxLength={500}
            disabled={isCorrecting}
            className="min-h-[80px] resize-none bg-background/60"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[10px] text-muted-foreground">{correction.length}/500</p>
            <Button
              variant="hero"
              size="sm"
              onClick={submitCorrection}
              disabled={!correction.trim() || isCorrecting}
              className="gap-2"
            >
              {isCorrecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isCorrecting ? "Re-analyzing…" : "Re-analyze"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

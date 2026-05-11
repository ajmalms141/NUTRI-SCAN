import { useState } from "react";
import { Wallet, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Alternative {
  name: string;
  approxQuantity: string;
  healthScore: number;
  reason: string;
  keyBenefit: string;
}

interface AlternativesSuggesterProps {
  originalFood: string;
  originalHealthScore: number;
}

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "AED"];

export const AlternativesSuggester = ({ originalFood, originalHealthScore }: AlternativesSuggesterProps) => {
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<Alternative[] | null>(null);
  const [notes, setNotes] = useState<string>("");

  const submit = async () => {
    const numPrice = parseFloat(price);
    if (!numPrice || numPrice <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-alternatives", {
        body: {
          originalFood,
          originalHealthScore,
          price: numPrice,
          currency,
          region: region.trim() || undefined,
        },
      });
      if (error) {
        const ctx = (error as { context?: { status?: number } }).context;
        if (ctx?.status === 429) toast.error("Rate limit reached. Please wait a moment.");
        else if (ctx?.status === 402) toast.error("AI credits exhausted.");
        else toast.error(error.message || "Could not get suggestions.");
        return;
      }
      if (!data || data.error) {
        toast.error(data?.error || "Could not get suggestions.");
        return;
      }
      setAlternatives(data.alternatives || []);
      setNotes(data.notes || "");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">Smarter buys for the same money</h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Tell me what you paid for this and I'll suggest healthier foods you could buy with the same budget.
      </p>

      <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_120px_1fr]">
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price you paid"
          disabled={loading}
          className="bg-background/60"
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          disabled={loading}
          className="rounded-md border border-input bg-background/60 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Region (optional, e.g. India)"
          disabled={loading}
          className="col-span-2 bg-background/60 sm:col-span-1"
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="hero"
          size="sm"
          onClick={submit}
          disabled={loading || !price}
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Finding…" : "Suggest alternatives"}
        </Button>
      </div>

      {alternatives && alternatives.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            For ~{price} {currency} you could get
          </p>
          {alternatives.map((alt, i) => {
            const better = alt.healthScore - originalHealthScore;
            return (
              <div
                key={`${alt.name}-${i}`}
                className="rounded-xl border border-border bg-background/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold">{alt.name}</p>
                    <p className="text-xs text-muted-foreground">{alt.approxQuantity}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-bold text-success">{alt.healthScore}</p>
                    {better > 0 && (
                      <p className="flex items-center justify-end gap-0.5 text-[10px] font-medium text-success">
                        <TrendingUp className="h-3 w-3" />+{better}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground/90">{alt.reason}</p>
                <span className="mt-2 inline-block rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                  {alt.keyBenefit}
                </span>
              </div>
            );
          })}
          {notes && <p className="text-xs text-muted-foreground">{notes}</p>}
        </div>
      )}
    </section>
  );
};

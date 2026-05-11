import { useState } from "react";
import { Leaf, Sparkles, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ImageCapture } from "@/components/ImageCapture";
import { ResultsView, type AnalysisResult } from "@/components/ResultsView";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastImage, setLastImage] = useState<{ base64: string; mimeType: string; userContext: string } | null>(null);

  const runAnalysis = async (
    base64: string,
    mimeType: string,
    userContext: string,
    extras: { previousResult?: AnalysisResult; correction?: string } = {},
  ) => {
    const isCorrection = !!extras.correction;
    if (isCorrection) setIsCorrecting(true);
    else setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: {
          imageBase64: base64,
          mimeType,
          userContext,
          previousResult: extras.previousResult,
          correction: extras.correction,
        },
      });
      if (error) {
        const ctx = (error as { context?: { status?: number } }).context;
        if (ctx?.status === 429) {
          toast.error("Rate limit reached. Please wait a moment and try again.");
        } else if (ctx?.status === 402) {
          toast.error("AI credits exhausted. Add credits in workspace settings.");
        } else {
          toast.error(error.message || "Could not analyze image.");
        }
        return;
      }
      if (!data || data.error) {
        toast.error(data?.error || "Could not analyze image.");
        return;
      }
      setResult(data as AnalysisResult);
      if (isCorrection) toast.success("Updated with your correction");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setIsCorrecting(false);
    }
  };

  const handleImageReady = async (base64: string, mimeType: string, preview: string, userContext: string) => {
    setPreviewUrl(preview);
    setResult(null);
    setLastImage({ base64, mimeType, userContext });
    await runAnalysis(base64, mimeType, userContext);
  };

  const handleCorrection = async (correction: string) => {
    if (!lastImage || !result) return;
    await runAnalysis(lastImage.base64, lastImage.mimeType, lastImage.userContext, {
      previousResult: result,
      correction,
    });
  };

  const reset = () => {
    setPreviewUrl(null);
    setResult(null);
    setIsAnalyzing(false);
    setIsCorrecting(false);
    setLastImage(null);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50">
        <div className="container flex items-center justify-between py-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none tracking-tight">NutriScan</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">AI food analyzer</p>
            </div>
          </div>
          {(previewUrl || result) && !isAnalyzing && (
            <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              New scan
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-3xl py-8 sm:py-12">
        {!previewUrl && !result && (
          <section className="mb-8 text-center sm:mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Powered by vision AI
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Know exactly what's <span className="text-gradient-primary">on your plate</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Snap a meal or a packaged product. Get protein, calories, vitamins, fats — and a clear
              warning when artificial ingredients are hiding in your food.
            </p>
          </section>
        )}

        <ImageCapture
          onImageReady={handleImageReady}
          onClear={reset}
          previewUrl={previewUrl}
          isAnalyzing={isAnalyzing}
        />

        {result && (
          <div className="mt-8">
            <ResultsView result={result} onCorrection={handleCorrection} isCorrecting={isCorrecting} />
            <div className="mt-8 flex justify-center">
              <Button variant="hero" size="lg" onClick={reset} className="gap-2">
                <RotateCcw className="h-5 w-5" />
                Scan another food
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        Estimates from AI vision · not a substitute for medical or dietary advice.
      </footer>
    </div>
  );
};

export default Index;

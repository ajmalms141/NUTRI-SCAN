import { useCallback, useRef, useState } from "react";
import { Camera, Upload, Loader2, X, MessageSquare, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ImageCaptureProps {
  onImageReady: (base64: string, mimeType: string, previewUrl: string, userContext: string) => void;
  onClear: () => void;
  previewUrl: string | null;
  isAnalyzing: boolean;
}

export const ImageCapture = ({ onImageReady, onClear, previewUrl, isAnalyzing }: ImageCaptureProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [userContext, setUserContext] = useState("");
  const [pendingFile, setPendingFile] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [textOnly, setTextOnly] = useState("");

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        setPendingFile({ base64, mimeType: file.type || "image/jpeg", preview: result });
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const submit = () => {
    if (!pendingFile) return;
    onImageReady(pendingFile.base64, pendingFile.mimeType, pendingFile.preview, userContext);
  };

  const cancelPending = () => {
    setPendingFile(null);
    setUserContext("");
  };

  const submitTextOnly = () => {
    const trimmed = textOnly.trim();
    if (!trimmed) return;
    // Send a 1x1 transparent PNG as a placeholder image so the edge function still works,
    // and put the user's description in userContext so the AI analyzes from text.
    const placeholderBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const preview =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'><rect width='100%' height='100%' fill='hsl(220 25% 10%)'/><text x='50%' y='50%' fill='hsl(0 0% 95%)' font-family='sans-serif' font-size='18' text-anchor='middle' dominant-baseline='middle'>Text-only entry</text></svg>`,
      );
    const contextForAi = `NO IMAGE PROVIDED. The user typed what they ate. Analyze purely from this description: "${trimmed}"`;
    onImageReady(placeholderBase64, "image/png", preview, contextForAi);
    setTextOnly("");
  };

  if (previewUrl) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-elegant animate-fade-up">
        <img src={previewUrl} alt="Food to analyze" className="h-72 w-full object-cover sm:h-96" />
        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-display text-lg font-semibold tracking-tight">Analyzing your food…</p>
            <p className="text-sm text-muted-foreground">Identifying ingredients and macros</p>
          </div>
        )}
        {!isAnalyzing && (
          <button
            onClick={onClear}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition hover:bg-background"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  if (pendingFile) {
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
          <img src={pendingFile.preview} alt="Food preview" className="h-64 w-full object-cover sm:h-80" />
          <button
            onClick={cancelPending}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition hover:bg-background"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
          <label htmlFor="user-context" className="mb-2 flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4 text-primary" />
            Add details (optional)
          </label>
          <Textarea
            id="user-context"
            value={userContext}
            onChange={(e) => setUserContext(e.target.value)}
            placeholder="e.g. I ate 2 of these · half a bowl · is the brown stuff sugar? · brand is Maggi…"
            maxLength={500}
            className="min-h-[90px] resize-none bg-background/60"
          />
          <p className="mt-1.5 text-right text-[10px] text-muted-foreground">{userContext.length}/500</p>
        </div>
        <Button size="lg" variant="hero" onClick={submit} className="w-full gap-2">
          Analyze food
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 border-dashed bg-gradient-card p-8 sm:p-12 transition-all",
        dragOver ? "border-primary shadow-glow" : "border-border hover:border-primary/50",
      )}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-glow rounded-full" />
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <Camera className="h-9 w-9" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Scan any food
          </h2>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            Take a photo of your meal or a packaged product. Get macros, vitamins, and a real
            health score in seconds.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            variant="hero"
            onClick={() => cameraInputRef.current?.click()}
            className="gap-2"
          >
            <Camera className="h-5 w-5" />
            Take photo
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-5 w-5" />
            Upload image
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG, or HEIC · drop a file anywhere here</p>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />

      <div className="mt-6 border-t border-border/60 pt-6">
        <label htmlFor="text-only-food" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Type className="h-4 w-4 text-primary" />
          Or just type what you ate
        </label>
        <Textarea
          id="text-only-food"
          value={textOnly}
          onChange={(e) => setTextOnly(e.target.value)}
          placeholder="e.g. 2 boiled eggs and a slice of brown toast · a bowl of Maggi noodles · 1 Snickers bar…"
          maxLength={500}
          className="min-h-[80px] resize-none bg-background/60"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">{textOnly.length}/500</p>
          <Button
            size="sm"
            variant="hero"
            onClick={submitTextOnly}
            disabled={!textOnly.trim()}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Analyze text
          </Button>
        </div>
      </div>
    </div>
  );
};

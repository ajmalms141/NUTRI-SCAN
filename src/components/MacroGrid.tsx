import { Flame, Beef, Wheat, Droplet } from "lucide-react";

interface MacroGridProps {
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
}

const Macro = ({
  label,
  value,
  unit,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  accent: string;
}) => (
  <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className={`grid h-7 w-7 place-items-center rounded-lg ${accent}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <div className="mt-3 flex items-baseline gap-1">
      <span className="font-display text-2xl font-bold text-foreground">{Math.round(value)}</span>
      <span className="text-sm text-muted-foreground">{unit}</span>
    </div>
  </div>
);

export const MacroGrid = ({ nutrition }: MacroGridProps) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <Macro label="Calories" value={nutrition.calories} unit="kcal" icon={Flame} accent="bg-warning/15 text-warning" />
    <Macro label="Protein" value={nutrition.proteinG} unit="g" icon={Beef} accent="bg-success/15 text-success" />
    <Macro label="Carbs" value={nutrition.carbsG} unit="g" icon={Wheat} accent="bg-primary/15 text-primary" />
    <Macro label="Fat" value={nutrition.fatG} unit="g" icon={Droplet} accent="bg-accent/15 text-accent" />
  </div>
);

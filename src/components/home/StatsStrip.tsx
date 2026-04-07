import { Palette, Users, Building2 } from "lucide-react";
import { useCollectionCounts } from "@/hooks/useCollectionCounts";

const StatItem = ({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number | undefined;
  label: string;
}) => (
  <div className="flex items-center gap-3 py-5">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground font-display tabular-nums">
        {value ?? "—"}
      </p>
      <p className="text-sm text-muted-foreground font-body">{label}</p>
    </div>
  </div>
);

export const StatsStrip = () => {
  const { works, artists, buildings } = useCollectionCounts();

  return (
    <section className="border-b border-border bg-surface-warm">
      <div className="container grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <StatItem icon={Palette} value={works.data} label="Total Works" />
        <div className="sm:pl-8">
          <StatItem icon={Users} value={artists.data} label="Artists Represented" />
        </div>
        <div className="sm:pl-8">
          <StatItem icon={Building2} value={buildings.data} label="Buildings" />
        </div>
      </div>
    </section>
  );
};

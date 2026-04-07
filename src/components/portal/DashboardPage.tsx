import { useNavigate } from "react-router-dom";
import {
  Image,
  Eye,
  Archive,
  AlertTriangle,
  Users,
  Building2,
  Plus,
  ClipboardCheck,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/components/portal/PortalContext";
import {
  useDashboardStats,
  useClassificationCounts,
  useConditionCounts,
} from "@/hooks/useDashboardStats";

/* ── Stat Card ─────────────────────────────────── */
const StatCard = ({
  icon: Icon,
  label,
  value,
  loading,
  onClick,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  loading: boolean;
  onClick: () => void;
  accent: string;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer w-full"
  >
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${accent}18`, color: accent }}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground font-body">{label}</p>
      {loading ? (
        <div className="h-7 w-12 rounded bg-muted animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold text-card-foreground font-display tabular-nums">
          {value ?? "—"}
        </p>
      )}
    </div>
  </button>
);

/* ── Dashboard Page ────────────────────────────── */
export const DashboardPage = () => {
  const navigate = useNavigate();
  const portal = usePortal();
  const stats = useDashboardStats();
  const { data: classData, isLoading: classLoading } = useClassificationCounts();
  const { data: condData, isLoading: condLoading } = useConditionCounts();

  const base = portal.basePath;
  const accent = portal.accentColor;

  const statCards = [
    { icon: Image, label: "Total Works", value: stats.totalWorks.data, loading: stats.totalWorks.isLoading, path: `${base}/works` },
    { icon: Eye, label: "On Display", value: stats.onDisplay.data, loading: stats.onDisplay.isLoading, path: `${base}/works?display=true` },
    { icon: Archive, label: "In Storage", value: stats.inStorage.data, loading: stats.inStorage.isLoading, path: `${base}/works?display=false` },
    { icon: AlertTriangle, label: "Needs Review", value: stats.needsReview.data, loading: stats.needsReview.isLoading, path: `${base}/works?status=needs_review` },
    { icon: Users, label: "Total Artists", value: stats.totalArtists.data, loading: stats.totalArtists.isLoading, path: `${base}/artists` },
    { icon: Building2, label: "Buildings", value: stats.totalBuildings.data, loading: stats.totalBuildings.isLoading, path: `${base}/locations` },
  ];

  const conditionColors: Record<string, string> = {
    Excellent: "#22c55e",
    Good: "#84cc16",
    Fair: "#eab308",
    Poor: "#f97316",
    Critical: "#ef4444",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Collection overview and quick actions</p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            loading={card.loading}
            accent={accent}
            onClick={() => navigate(card.path)}
          />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.54fr] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Classification chart */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-card-foreground">Works by Classification</h2>
            </div>
            {classLoading ? (
              <div className="h-64 bg-muted rounded animate-pulse" />
            ) : classData && classData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={classData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(entry: { name: string }) => {
                      navigate(`${base}/works?classification=${encodeURIComponent(entry.name)}`);
                    }}
                  >
                    {classData.map((_, i) => (
                      <Cell key={i} fill={accent} opacity={0.85 - i * 0.06} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No classification data available.</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-card-foreground">Recent Activity</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Clock className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No activity recorded yet</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Condition Overview */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-card-foreground">Condition Overview</h2>
            </div>
            {condLoading ? (
              <div className="h-40 bg-muted rounded animate-pulse" />
            ) : condData && condData.length > 0 ? (
              <div className="space-y-3">
                {condData.map((item) => {
                  const max = Math.max(...condData.map((d) => d.count));
                  const pct = (item.count / max) * 100;
                  const color = conditionColors[item.name] || accent;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-card-foreground font-medium">{item.name}</span>
                        <span className="text-muted-foreground tabular-nums">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No condition reports yet</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-card-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Add Work", path: `${base}/works/new` },
                { label: "Add Artist", path: `${base}/artists/new` },
                { label: "Add Condition Report", path: `${base}/condition/new` },
                { label: "Record Loan", path: `${base}/loans/new` },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate(action.path)}
                >
                  <Plus className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { usePortal } from "@/components/portal/PortalContext";

const conditionColors: Record<string, string> = {
  Excellent: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Good: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  Fair: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Poor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

interface ConditionCardProps {
  report: Tables<"condition_reports">;
  workId: string;
}

export const ConditionCard = ({ report, workId }: ConditionCardProps) => {
  const portal = usePortal();

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-card-foreground">Latest Condition</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            conditionColors[report.overall_condition] || "bg-gray-100 text-gray-800"
          }`}
        >
          {report.overall_condition}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(report.assessment_date).toLocaleDateString()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Assessed by {report.assessed_by}
      </p>
      <Link
        to={`${portal.basePath}/condition`}
        className="text-xs text-primary hover:underline"
      >
        View all reports →
      </Link>
    </div>
  );
};

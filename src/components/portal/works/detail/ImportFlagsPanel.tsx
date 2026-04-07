import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateWork } from "@/hooks/useWorkDetail";
import { toast } from "sonner";

const flagLabels: Record<string, string> = {
  untitled: "Untitled work",
  "no-accession": "Missing accession number",
  "class-unknown": "Classification unverified",
};

interface ImportFlagsPanelProps {
  workId: string;
  flags: string[];
}

export const ImportFlagsPanel = ({ workId, flags }: ImportFlagsPanelProps) => {
  const updateWork = useUpdateWork();

  const handleMarkReviewed = () => {
    updateWork.mutate(
      { id: workId, updates: { import_status: "published", import_flags: null } },
      { onSuccess: () => toast.success("Marked as reviewed") }
    );
  };

  return (
    <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-semibold">Import Flags</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {flags.map((flag) => (
          <span
            key={flag}
            className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 text-xs font-medium"
          >
            {flagLabels[flag] || flag}
          </span>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        onClick={handleMarkReviewed}
        disabled={updateWork.isPending}
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Mark as reviewed
      </Button>
    </div>
  );
};

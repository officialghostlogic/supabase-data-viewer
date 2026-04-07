import { useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectionActionBarProps {
  count: number;
  totalCount?: number;
  allPageSelected?: boolean;
  hasMorePages?: boolean;
  onSelectAll?: () => void;
  onClear: () => void;
  onDelete: () => void;
  label?: string;
}

export const SelectionActionBar = ({
  count,
  totalCount,
  allPageSelected,
  hasMorePages,
  onSelectAll,
  onClear,
  onDelete,
  label = "works",
}: SelectionActionBarProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClear();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClear]);

  if (count === 0) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-accent bg-accent/10 sticky top-0 z-10 animate-in slide-in-from-top-2 duration-200"
    >
      <span className="text-sm font-medium text-accent-foreground">
        {count} {label} selected
      </span>

      {allPageSelected && hasMorePages && totalCount && onSelectAll && count < totalCount && (
        <button
          onClick={onSelectAll}
          className="text-sm text-primary underline underline-offset-2 hover:no-underline"
        >
          Select all {totalCount} {label}
        </button>
      )}

      <button
        onClick={onClear}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
      >
        Clear selection
      </button>

      <div className="ml-auto">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete selected
        </Button>
      </div>
    </div>
  );
};

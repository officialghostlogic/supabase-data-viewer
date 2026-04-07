import { useState, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWorksFilterOptions } from "@/hooks/useWorksList";
import type { WorksFilters } from "@/hooks/useWorksList";

interface WorksFilterBarProps {
  filters: WorksFilters;
  setFilter: (key: keyof WorksFilters, value: string | number) => void;
  clearAll: () => void;
  hasActiveFilters: boolean;
}

const displayToggleOptions = [
  { label: "All", value: "all" },
  { label: "On Display", value: "true" },
  { label: "In Storage", value: "false" },
];

const statusOptions = [
  { label: "All Statuses", value: "__all__" },
  { label: "Published", value: "published" },
  { label: "Needs Review", value: "needs_review" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];

export const WorksFilterBar = ({
  filters,
  setFilter,
  clearAll,
  hasActiveFilters,
}: WorksFilterBarProps) => {
  const { classifications, buildings } = useWorksFilterOptions();
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== filters.search) {
        setFilter("search", localSearch);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch]);

  // Sync external search changes
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const activeChips: { key: keyof WorksFilters; label: string; value: string }[] = [];
  if (filters.search) activeChips.push({ key: "search", label: "Search", value: filters.search });
  if (filters.classification) activeChips.push({ key: "classification", label: "Classification", value: filters.classification });
  if (filters.location_building) activeChips.push({ key: "location_building", label: "Building", value: filters.location_building });
  if (filters.import_status) activeChips.push({ key: "import_status", label: "Status", value: filters.import_status });
  if (filters.is_on_display !== "all") activeChips.push({ key: "is_on_display", label: "Display", value: filters.is_on_display === "true" ? "On Display" : "In Storage" });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, artist, accession #, barcode…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {localSearch && (
            <button
              onClick={() => { setLocalSearch(""); setFilter("search", ""); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Classification */}
        <Select
          value={filters.classification || "__all__"}
          onValueChange={(v) => setFilter("classification", v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Classification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Classes</SelectItem>
            {classifications.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Building */}
        <Select
          value={filters.location_building || "__all__"}
          onValueChange={(v) => setFilter("location_building", v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Building" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Buildings</SelectItem>
            {buildings.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={filters.import_status || "__all__"}
          onValueChange={(v) => setFilter("import_status", v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Display toggle */}
        <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
          {displayToggleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter("is_on_display", opt.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filters.is_on_display === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-medium cursor-pointer hover:bg-secondary/60"
              onClick={() =>
                setFilter(chip.key, chip.key === "is_on_display" ? "all" : "")
              }
            >
              <span className="text-muted-foreground">{chip.label}:</span> {chip.value}
              <X className="h-3 w-3 text-muted-foreground" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

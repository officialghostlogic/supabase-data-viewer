import { useNavigate } from "react-router-dom";
import { Plus, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/components/portal/PortalContext";
import { useWorksList } from "@/hooks/useWorksList";
import { useWorksUrlFilters } from "@/hooks/useWorksUrlFilters";
import { WorksFilterBar } from "@/components/portal/works/WorksFilterBar";
import { WorksTable } from "@/components/portal/works/WorksTable";
import { WorksPagination } from "@/components/portal/works/WorksPagination";

export const WorksListPage = () => {
  const navigate = useNavigate();
  const portal = usePortal();
  const { filters, setFilter, clearAll, hasActiveFilters } = useWorksUrlFilters();
  const { data, isLoading } = useWorksList(filters);

  const total = data?.count ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground font-display">Works</h1>
          {!isLoading && (
            <Badge variant="secondary" className="text-xs font-medium tabular-nums">
              {total} works
            </Badge>
          )}
        </div>
        <Button
          onClick={() => navigate(`${portal.basePath}/works/new`)}
          size="sm"
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Work
        </Button>
      </div>

      {/* Filter bar */}
      <WorksFilterBar
        filters={filters}
        setFilter={setFilter}
        clearAll={clearAll}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table or empty state */}
      {!isLoading && data && data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card">
          <SearchX className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <p className="text-base font-medium text-foreground mb-1">
            No works match your current filters
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filters
          </p>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear all filters
          </Button>
        </div>
      ) : (
        <>
          <WorksTable works={data?.data ?? []} loading={isLoading} />
          {data && data.count > data.pageSize && (
            <WorksPagination
              page={filters.page}
              pageSize={data.pageSize}
              total={data.count}
              onPageChange={(p) => setFilter("page", p)}
            />
          )}
        </>
      )}
    </div>
  );
};

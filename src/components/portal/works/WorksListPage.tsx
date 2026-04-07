import { useState, useCallback, useEffect } from "react";
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
import { SelectionActionBar } from "@/components/portal/shared/SelectionActionBar";
import { DeleteWorksDialog } from "@/components/portal/shared/DeleteWorksDialog";

export const WorksListPage = () => {
  const navigate = useNavigate();
  const portal = usePortal();
  const { filters, setFilter, clearAll, hasActiveFilters } = useWorksUrlFilters();
  const { data, isLoading } = useWorksList(filters);

  const total = data?.count ?? 0;
  const isAdmin = portal.role === "admin";

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Clear selection when filters change
  const filterKey = JSON.stringify({ ...filters, page: undefined });
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllPages(false);
  }, [filterKey]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectAllPages(false);
  }, []);

  const toggleAllOnPage = useCallback(() => {
    const pageIds = data?.data.map((w) => w.id) ?? [];
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
    if (allSelected) setSelectAllPages(false);
  }, [data, selectedIds]);

  const handleSelectAllPages = useCallback(async () => {
    // Fetch ALL work ids matching current filters
    const { supabase } = await import("@/integrations/supabase/client");
    let query = supabase.from("works").select("id");
    if (filters.classification) query = query.eq("classification", filters.classification);
    if (filters.location_building) query = query.eq("location_building", filters.location_building);
    if (filters.import_status) query = query.eq("import_status", filters.import_status);
    if (filters.is_on_display === "true") query = query.eq("is_on_display", true);
    else if (filters.is_on_display === "false") query = query.eq("is_on_display", false);
    if (filters.search) {
      const s = `%${filters.search}%`;
      query = query.or(`title.ilike.${s},artist_name.ilike.${s},accession_number.ilike.${s},barcode.ilike.${s}`);
    }
    const { data: allWorks } = await query;
    if (allWorks) {
      setSelectedIds(new Set(allWorks.map((w) => w.id)));
      setSelectAllPages(true);
    }
  }, [filters]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAllPages(false);
  }, []);

  const handleDeleted = useCallback(() => {
    clearSelection();
    // If current page would be empty, go back
    if (data && data.data.length <= selectedIds.size && filters.page > 1) {
      setFilter("page", filters.page - 1);
    }
  }, [data, selectedIds, filters.page, setFilter, clearSelection]);

  const pageIds = data?.data.map((w) => w.id) ?? [];
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const hasMorePages = total > (data?.pageSize ?? 25);
  const selectionCount = selectAllPages ? total : selectedIds.size;

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

      {/* Selection action bar (admin only) */}
      {isAdmin && selectedIds.size > 0 && (
        <SelectionActionBar
          count={selectionCount}
          totalCount={total}
          allPageSelected={allPageSelected}
          hasMorePages={hasMorePages}
          onSelectAll={handleSelectAllPages}
          onClear={clearSelection}
          onDelete={() => setShowDeleteDialog(true)}
          label="works"
        />
      )}

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
          <WorksTable
            works={data?.data ?? []}
            loading={isLoading}
            showCheckboxes={isAdmin}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAllOnPage}
          />
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

      {/* Delete dialog */}
      <DeleteWorksDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedIds={Array.from(selectedIds)}
        onDeleted={handleDeleted}
      />
    </div>
  );
};

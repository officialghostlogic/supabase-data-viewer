import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { WorksFilters } from "@/hooks/useWorksList";

const FILTER_KEYS = ["search", "classification", "location_building", "import_status", "is_on_display", "page"] as const;

const defaults: WorksFilters = {
  search: "",
  classification: "",
  location_building: "",
  import_status: "",
  is_on_display: "all",
  page: 1,
};

export const useWorksUrlFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: WorksFilters = useMemo(() => ({
    search: searchParams.get("search") || "",
    classification: searchParams.get("classification") || "",
    location_building: searchParams.get("location_building") || "",
    import_status: searchParams.get("import_status") || "",
    is_on_display: searchParams.get("is_on_display") || "all",
    page: parseInt(searchParams.get("page") || "1", 10) || 1,
  }), [searchParams]);

  const setFilter = useCallback(
    (key: keyof WorksFilters, value: string | number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const strVal = String(value);
        if (strVal === "" || strVal === "all" || (key === "page" && value === 1)) {
          next.delete(key);
        } else {
          next.set(key, strVal);
        }
        if (key !== "page") next.delete("page");
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const clearAll = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters = useMemo(
    () =>
      filters.search !== "" ||
      filters.classification !== "" ||
      filters.location_building !== "" ||
      filters.import_status !== "" ||
      filters.is_on_display !== "all",
    [filters]
  );

  return { filters, setFilter, clearAll, hasActiveFilters };
};

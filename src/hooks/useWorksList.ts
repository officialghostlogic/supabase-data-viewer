import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WorksFilters {
  search: string;
  classification: string;
  location_building: string;
  import_status: string;
  is_on_display: string; // "all" | "true" | "false"
  page: number;
}

const PAGE_SIZE = 25;

export const useWorksList = (filters: WorksFilters) =>
  useQuery({
    queryKey: ["works-list", filters],
    queryFn: async () => {
      let query = supabase
        .from("works")
        .select(
          "id, accession_number, barcode, title, artist_name, classification, medium, location_building, location_floor, location_room, is_on_display, import_status, import_flags, date_created, data_quality_score, created_at",
          { count: "exact" }
        )
        .is("deleted_at", null)
        .order("accession_number", { ascending: true, nullsFirst: false });

      if (filters.classification) {
        query = query.eq("classification", filters.classification);
      }
      if (filters.location_building) {
        query = query.eq("location_building", filters.location_building);
      }
      if (filters.import_status) {
        query = query.eq("import_status", filters.import_status);
      }
      if (filters.is_on_display === "true") {
        query = query.eq("is_on_display", true);
      } else if (filters.is_on_display === "false") {
        query = query.eq("is_on_display", false);
      }
      if (filters.search) {
        const s = `%${filters.search}%`;
        query = query.or(
          `title.ilike.${s},artist_name.ilike.${s},accession_number.ilike.${s},barcode.ilike.${s}`
        );
      }

      const from = (filters.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0, pageSize: PAGE_SIZE };
    },
    staleTime: 30_000,
  });

export const useWorksFilterOptions = () => {
  const classifications = useQuery({
    queryKey: ["filter-options", "classifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("works")
        .select("classification")
        .is("deleted_at", null)
        .not("classification", "is", null);
      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.classification).filter(Boolean))] as string[];
      return unique.sort();
    },
    staleTime: 5 * 60_000,
  });

  const buildings = useQuery({
    queryKey: ["filter-options", "buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("works")
        .select("location_building")
        .is("deleted_at", null)
        .not("location_building", "is", null);
      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.location_building).filter(Boolean))] as string[];
      return unique.sort();
    },
    staleTime: 5 * 60_000,
  });

  return { classifications: classifications.data ?? [], buildings: buildings.data ?? [] };
};

export const usePrimaryImages = (workIds: string[]) =>
  useQuery({
    queryKey: ["primary-images", workIds],
    queryFn: async () => {
      if (!workIds.length) return {};
      const { data, error } = await supabase
        .from("digital_assets")
        .select("work_id, file_url")
        .in("work_id", workIds)
        .eq("is_primary", true);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((d) => { map[d.work_id] = d.file_url; });
      return map;
    },
    enabled: workIds.length > 0,
    staleTime: 5 * 60_000,
  });

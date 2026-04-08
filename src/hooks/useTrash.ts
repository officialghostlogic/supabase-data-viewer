import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrashRecord {
  id: string;
  deleted_at: string;
  [key: string]: unknown;
}

type TrashTable = "works" | "artists" | "locations" | "buildings";

export const useTrashCounts = () =>
  useQuery({
    queryKey: ["trash-counts"],
    queryFn: async () => {
      const tables: TrashTable[] = ["works", "artists", "locations", "buildings"];
      const counts: Record<TrashTable, number> = { works: 0, artists: 0, locations: 0, buildings: 0 };
      
      const results = await Promise.all(
        tables.map((t) =>
          supabase.from(t).select("*", { count: "exact", head: true }).not("deleted_at", "is", null)
        )
      );
      
      tables.forEach((t, i) => {
        counts[t] = results[i].count ?? 0;
      });
      
      return counts;
    },
    staleTime: 30_000,
  });

export const useTrashTotal = () => {
  const { data } = useTrashCounts();
  if (!data) return 0;
  return data.works + data.artists + data.locations + data.buildings;
};

export const useTrashItems = (table: TrashTable) =>
  useQuery({
    queryKey: ["trash-items", table],
    queryFn: async () => {
      let selectFields: string;
      switch (table) {
        case "works":
          selectFields = "id, title, artist_name, accession_number, classification, deleted_at, deleted_by";
          break;
        case "artists":
          selectFields = "id, display_name, deleted_at, deleted_by";
          break;
        case "locations":
          selectFields = "id, full_location, building, deleted_at, deleted_by";
          break;
        case "buildings":
          selectFields = "id, name, deleted_at, deleted_by";
          break;
      }
      
      const { data, error } = await supabase
        .from(table)
        .select(selectFields)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const useRestoreRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id }: { table: TrashTable; id: string }) => {
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trash-items", vars.table] });
      qc.invalidateQueries({ queryKey: ["trash-counts"] });
      qc.invalidateQueries({ queryKey: [`${vars.table}-list`] });
      qc.invalidateQueries({ queryKey: ["works-list"] });
      qc.invalidateQueries({ queryKey: ["artists-list"] });
      qc.invalidateQueries({ queryKey: ["buildings-index"] });
    },
  });
};

export const usePermanentDelete = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id }: { table: TrashTable; id: string }) => {
      if (table === "works") {
        await supabase.from("digital_assets").delete().eq("work_id", id);
        await supabase.from("condition_reports").delete().eq("work_id", id);
        await supabase.from("loans").delete().eq("work_id", id);
      }
      if (table === "artists") {
        await supabase.from("works").update({ artist_id: null }).eq("artist_id", id);
      }
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trash-items", vars.table] });
      qc.invalidateQueries({ queryKey: ["trash-counts"] });
    },
  });
};

export const useBulkRestore = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, ids }: { table: TrashTable; ids: string[] }) => {
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: null, deleted_by: null })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trash-items", vars.table] });
      qc.invalidateQueries({ queryKey: ["trash-counts"] });
      qc.invalidateQueries({ queryKey: ["works-list"] });
      qc.invalidateQueries({ queryKey: ["artists-list"] });
      qc.invalidateQueries({ queryKey: ["buildings-index"] });
    },
  });
};

export const useBulkPermanentDelete = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, ids }: { table: TrashTable; ids: string[] }) => {
      if (table === "works") {
        await supabase.from("digital_assets").delete().in("work_id", ids);
        await supabase.from("condition_reports").delete().in("work_id", ids);
        await supabase.from("loans").delete().in("work_id", ids);
      }
      if (table === "artists") {
        await supabase.from("works").update({ artist_id: null }).in("artist_id", ids);
      }
      const { error } = await supabase.from(table).delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trash-items", vars.table] });
      qc.invalidateQueries({ queryKey: ["trash-counts"] });
    },
  });
};

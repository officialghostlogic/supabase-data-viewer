import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useWorkDetail = (id: string) =>
  useQuery({
    queryKey: ["work-detail", id],
    queryFn: async () => {
      const { data: work, error: wErr } = await supabase
        .from("works")
        .select("*")
        .eq("id", id)
        .single();
      if (wErr) throw wErr;

      let artist = null;
      if (work.artist_id) {
        const { data } = await supabase
          .from("artists")
          .select("display_name, given_name, family_name, nationality, birth_year, death_year, is_isu_affiliated, bio")
          .eq("id", work.artist_id)
          .single();
        artist = data;
      }

      let location = null;
      let building = null;
      if (work.location_id) {
        const { data: loc } = await supabase
          .from("locations")
          .select("full_location, location_type, climate_controlled, security_level, building_id")
          .eq("id", work.location_id)
          .single();
        location = loc;
        if (loc?.building_id) {
          const { data: bld } = await supabase
            .from("buildings")
            .select("name, short_name")
            .eq("id", loc.building_id)
            .single();
          building = bld;
        }
      }

      return { work, artist, location, building };
    },
    enabled: !!id,
  });

export const useWorkAssets = (workId: string) =>
  useQuery({
    queryKey: ["work-assets", workId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("digital_assets")
        .select("*")
        .eq("work_id", workId)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!workId,
  });

export const useLatestCondition = (workId: string) =>
  useQuery({
    queryKey: ["work-condition", workId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condition_reports")
        .select("*")
        .eq("work_id", workId)
        .order("assessment_date", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!workId,
  });

export const useUpdateWork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("works")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["work-detail", vars.id] });
      qc.invalidateQueries({ queryKey: ["works-list"] });
    },
  });
};

export const useDeleteWork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("works").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["works-list"] });
    },
  });
};

export const useAdjacentWorks = (currentId: string) =>
  useQuery({
    queryKey: ["adjacent-works", currentId],
    queryFn: async () => {
      const { data: all, error } = await supabase
        .from("works")
        .select("id, title, accession_number")
        .order("accession_number", { ascending: true, nullsFirst: false });
      if (error) throw error;
      const idx = all?.findIndex((w) => w.id === currentId) ?? -1;
      return {
        prev: idx > 0 ? all![idx - 1] : null,
        next: idx >= 0 && idx < (all?.length ?? 0) - 1 ? all![idx + 1] : null,
      };
    },
    enabled: !!currentId,
  });

export const useAllArtists = () =>
  useQuery({
    queryKey: ["all-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, display_name")
        .order("display_name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

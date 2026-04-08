import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ArtistWithCount {
  id: string;
  display_name: string;
  given_name: string | null;
  family_name: string | null;
  nationality: string | null;
  birth_year: number | null;
  death_year: number | null;
  is_isu_affiliated: boolean | null;
  ulan_id: string | null;
  work_count: number;
}

export const useArtistsList = () =>
  useQuery({
    queryKey: ["artists-list"],
    queryFn: async () => {
      const { data: artists, error: aErr } = await supabase
        .from("artists")
        .select("id, display_name, given_name, family_name, nationality, birth_year, death_year, is_isu_affiliated, ulan_id")
        .is("deleted_at", null)
        .order("family_name", { ascending: true })
        .order("given_name", { ascending: true });
      if (aErr) throw aErr;

      const { data: works, error: wErr } = await supabase
        .from("works")
        .select("artist_id")
        .is("deleted_at", null);
      if (wErr) throw wErr;

      const countMap: Record<string, number> = {};
      works?.forEach((w) => {
        if (w.artist_id) countMap[w.artist_id] = (countMap[w.artist_id] || 0) + 1;
      });

      return (artists ?? []).map((a) => ({
        ...a,
        work_count: countMap[a.id] || 0,
      })) as ArtistWithCount[];
    },
    staleTime: 60_000,
  });

export const useArtistDetail = (id: string) =>
  useQuery({
    queryKey: ["artist-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useArtistWorks = (artistId: string) =>
  useQuery({
    queryKey: ["artist-works", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("works")
        .select("id, title, accession_number, classification, medium, date_created, location_building, location_room, is_on_display, data_quality_score")
        .eq("artist_id", artistId)
        .is("deleted_at", null)
        .order("date_created", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!artistId,
  });

export const useArtistConditionSummary = (artistId: string) =>
  useQuery({
    queryKey: ["artist-condition-summary", artistId],
    queryFn: async () => {
      const { data: works } = await supabase
        .from("works")
        .select("id")
        .eq("artist_id", artistId)
        .is("deleted_at", null);
      if (!works || works.length === 0) return null;

      const workIds = works.map((w) => w.id);
      const { data: reports, error } = await supabase
        .from("condition_reports")
        .select("overall_condition, work_id")
        .in("work_id", workIds);
      if (error) throw error;
      if (!reports || reports.length === 0) return null;

      const counts: Record<string, number> = {};
      const assessed = new Set<string>();
      reports.forEach((r) => {
        counts[r.overall_condition] = (counts[r.overall_condition] || 0) + 1;
        assessed.add(r.work_id);
      });

      return { totalAssessed: assessed.size, conditions: counts };
    },
    enabled: !!artistId,
  });

export const useUpdateArtist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("artists")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["artist-detail", vars.id] });
      qc.invalidateQueries({ queryKey: ["artists-list"] });
    },
  });
};

export const useCreateArtist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      display_name: string;
      given_name?: string;
      family_name?: string;
      nationality?: string;
      birth_year?: number | null;
      death_year?: number | null;
      is_isu_affiliated?: boolean;
      bio?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("artists")
        .insert(data)
        .select("id")
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artists-list"] });
    },
  });
};

export const useDeleteArtist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      // Soft delete: set deleted_at and deleted_by
      const { error } = await supabase
        .from("artists")
        .update({ deleted_at: new Date().toISOString(), deleted_by: role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artists-list"] });
      qc.invalidateQueries({ queryKey: ["works-list"] });
      qc.invalidateQueries({ queryKey: ["trash-counts"] });
    },
  });
};

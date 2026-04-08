import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardStats = () => {
  const totalWorks = useQuery({
    queryKey: ["dashboard", "total-works"],
    queryFn: async () => {
      const { count, error } = await supabase.from("works").select("*", { count: "exact", head: true }).is("deleted_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const onDisplay = useQuery({
    queryKey: ["dashboard", "on-display"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("works")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("is_on_display", true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const inStorage = useQuery({
    queryKey: ["dashboard", "in-storage"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("works")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("is_on_display", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const needsReview = useQuery({
    queryKey: ["dashboard", "needs-review"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("works")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("import_status", "needs_review");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const totalArtists = useQuery({
    queryKey: ["dashboard", "total-artists"],
    queryFn: async () => {
      const { count, error } = await supabase.from("artists").select("*", { count: "exact", head: true }).is("deleted_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const totalBuildings = useQuery({
    queryKey: ["dashboard", "total-buildings"],
    queryFn: async () => {
      const { count, error } = await supabase.from("buildings").select("*", { count: "exact", head: true }).is("deleted_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  return { totalWorks, onDisplay, inStorage, needsReview, totalArtists, totalBuildings };
};

export const useClassificationCounts = () =>
  useQuery({
    queryKey: ["dashboard", "classification-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("works")
        .select("classification")
        .is("deleted_at", null);
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((w) => {
        const cls = w.classification || "Unclassified";
        counts[cls] = (counts[cls] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

export const useConditionCounts = () =>
  useQuery({
    queryKey: ["dashboard", "condition-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condition_reports")
        .select("overall_condition");
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((r) => {
        const cond = r.overall_condition || "Unknown";
        counts[cond] = (counts[cond] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

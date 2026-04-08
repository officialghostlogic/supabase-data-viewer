import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFeaturedWorks = () =>
  useQuery({
    queryKey: ["featured-works"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("works")
        .select("id, title, artist_name, date_created, classification, is_on_display")
        .is("deleted_at", null)
        .eq("is_on_display", true)
        .limit(6);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

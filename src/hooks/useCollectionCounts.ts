import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TableName = "works" | "artists" | "locations" | "buildings";

const fetchCount = async (table: TableName) => {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
};

export const useTableCount = (table: TableName) =>
  useQuery({
    queryKey: [table, "count"],
    queryFn: () => fetchCount(table),
    staleTime: 5 * 60 * 1000,
  });

export const useCollectionCounts = () => {
  const works = useTableCount("works");
  const artists = useTableCount("artists");
  const locations = useTableCount("locations");
  const buildings = useTableCount("buildings");
  return { works, artists, locations, buildings };
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { data: count, isLoading, error } = useQuery({
    queryKey: ["works-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("works")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count;
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">ISU Art Collection</h1>
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">Error: {(error as Error).message}</p>}
        {count !== undefined && count !== null && (
          <p className="text-xl text-muted-foreground">
            <span className="font-semibold text-foreground">{count}</span> works in the collection
          </p>
        )}
      </div>
    </div>
  );
};

export default Index;

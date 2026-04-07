import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useCount = (table: "works" | "artists" | "locations" | "buildings") =>
  useQuery({
    queryKey: [table, "count"],
    queryFn: async () => {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) throw error;
      return count;
    },
  });

const Index = () => {
  const works = useCount("works");
  const artists = useCount("artists");
  const locations = useCount("locations");
  const buildings = useCount("buildings");

  const rows = [
    { label: "Works", expected: 124, ...works },
    { label: "Artists", expected: 75, ...artists },
    { label: "Locations", expected: 28, ...locations },
    { label: "Buildings", expected: 1, ...buildings },
  ];

  const allLoaded = rows.every((r) => !r.isLoading);
  const allMatch = allLoaded && rows.every((r) => r.data === r.expected);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-3xl font-bold text-foreground">ISU Art Collection — Connection Check</h1>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {rows.map((r) => (
            <div key={r.label} className="rounded-lg border border-border p-4 bg-card">
              <p className="text-sm text-muted-foreground">{r.label}</p>
              {r.isLoading ? (
                <p className="text-lg text-muted-foreground">…</p>
              ) : r.error ? (
                <p className="text-sm text-destructive">Error</p>
              ) : (
                <p className={`text-2xl font-bold ${r.data === r.expected ? "text-foreground" : "text-destructive"}`}>
                  {r.data}
                </p>
              )}
            </div>
          ))}
        </div>
        {allLoaded && (
          <p className={`text-lg font-semibold ${allMatch ? "text-foreground" : "text-destructive"}`}>
            {allMatch ? "✅ Connection confirmed — ready to build!" : "⚠️ Counts do not match expected values."}
          </p>
        )}
      </div>
    </div>
  );
};

export default Index;

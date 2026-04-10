import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ProcessedRow } from "@/utils/parseExcelRow";
import type { EmbeddedImage } from "@/utils/extractEmbeddedImages";
import { useImportMatching, type MatchResult } from "@/hooks/useImport";

interface Props {
  processedRows: ProcessedRow[];
  rowImageMap: Record<number, EmbeddedImage>;
  onNext: (results: MatchResult[]) => void;
  onBack: () => void;
  imagesLost?: boolean;
  expectedImageCount?: number;
  onReuploadFile?: () => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "New", variant: "default" },
  update: { label: "Update", variant: "secondary" },
  review: { label: "Review", variant: "outline" },
  skip: { label: "Skip", variant: "destructive" },
};

export function PreviewStep({ processedRows, rowImageMap, onNext, onBack, imagesLost, expectedImageCount, onReuploadFile }: Props) {
  const { matching, results, runMatching, toggleRow, toggleAll } = useImportMatching();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    runMatching(processedRows, rowImageMap);
  }, [processedRows, rowImageMap, runMatching]);

  const stats = useMemo(() => {
    const newCount = results.filter((r) => r.status === "new").length;
    const updateCount = results.filter((r) => r.status === "update").length;
    const reviewCount = results.filter((r) => r.status === "review").length;
    const skipCount = results.filter((r) => r.status === "skip").length;
    const newArtists = new Set(results.filter((r) => r.artistStatus === "new" && r.row.artist_display).map((r) => r.row.artist_display!));
    const newBuildings = new Set(results.filter((r) => r.buildingStatus === "new" && r.row.location_building).map((r) => r.row.location_building));
    const newLocations = new Set(results.filter((r) => r.locationStatus === "new" && r.row.location_full).map((r) => r.row.location_full!));
    return { newCount, updateCount, reviewCount, skipCount, newArtists, newBuildings, newLocations };
  }, [results]);

  const pagedResults = results.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(results.length / pageSize);
  const allIncluded = results.filter((r) => r.status !== "skip").every((r) => r.included);

  if (matching) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-primary/10 rounded-lg">
          <div className="text-2xl font-bold text-primary">{stats.newCount}</div>
          <div className="text-xs text-muted-foreground">New works</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-2xl font-bold">{stats.updateCount}</div>
          <div className="text-xs text-muted-foreground">Updates</div>
        </div>
        <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.reviewCount}</div>
          <div className="text-xs text-muted-foreground">Flagged</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-muted-foreground">{stats.skipCount}</div>
          <div className="text-xs text-muted-foreground">Skipped</div>
        </div>
      </div>

      {imagesLost && expectedImageCount ? (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Images need to be restored for this session.</p>
              <p className="text-sm text-muted-foreground">
                Re-upload the original .xlsx file to restore {expectedImageCount} image{expectedImageCount === 1 ? "" : "s"} for preview and upload.
              </p>
            </div>
            {onReuploadFile && (
              <Button type="button" variant="outline" onClick={onReuploadFile}>
                Re-upload original file
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {stats.newBuildings.size > 0 && (
        <div className="p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-sm">
          {stats.newBuildings.size} new building{stats.newBuildings.size > 1 ? "s" : ""} will be created: {Array.from(stats.newBuildings).join(", ")}
        </div>
      )}
      {stats.newLocations.size > 0 && (
        <div className="p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-sm">
          {stats.newLocations.size} new room{stats.newLocations.size > 1 ? "s" : ""} will be created
        </div>
      )}

      {/* Preview table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Preview ({results.length} rows)</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allIncluded}
                onCheckedChange={(v) => toggleAll(!!v)}
              />
              <span className="text-xs text-muted-foreground">Select all</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2 px-3 w-10" />
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground w-12">Img</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Accession</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Artist</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Class</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Location</th>
                  <th className="py-2 px-3 text-left font-medium text-muted-foreground">Flags</th>
                </tr>
              </thead>
              <tbody>
                {pagedResults.map((m, i) => {
                  const globalIdx = page * pageSize + i;
                  const img = rowImageMap[m.row.rowIndex];
                  const badge = STATUS_BADGE[m.status];
                  return (
                    <tr key={globalIdx} className={`border-b last:border-0 ${m.status === "skip" ? "opacity-50" : ""}`}>
                      <td className="py-2 px-3">
                        <Checkbox
                          checked={m.included}
                          onCheckedChange={() => toggleRow(globalIdx)}
                          disabled={m.status === "skip"}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                        {m.artistStatus === "new" && m.row.artist_display && (
                          <Badge variant="outline" className="text-xs ml-1">New artist</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {img && (
                          <img src={img.previewUrl} alt="" className="w-8 h-8 object-cover rounded" />
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">{m.row.accession_number || "—"}</td>
                      <td className="py-2 px-3 max-w-[200px] truncate">{m.row.title}</td>
                      <td className="py-2 px-3 max-w-[150px] truncate">{m.row.artist_display || "—"}</td>
                      <td className="py-2 px-3 text-xs">{m.row.classification}</td>
                      <td className="py-2 px-3 text-xs max-w-[200px] truncate">{m.row.location_full || "—"}</td>
                      <td className="py-2 px-3">
                        {m.row.import_flags.map((f) => (
                          <Badge key={f} variant="outline" className="text-xs mr-1">{f}</Badge>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                Prev
              </Button>
              <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={() => onNext(results)} disabled={results.filter((r) => r.included).length === 0}>
          Continue →
        </Button>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useImportMatching } from "@/hooks/useImport";
import { useImportContext } from "./ImportPage";
import type { ParsedRow } from "@/utils/parseExcelRow";
import type { EmbeddedImage } from "@/utils/extractEmbeddedImages";

interface Props {
  parsedRows: ParsedRow[];
  rowImageMap: Record<number, EmbeddedImage>;
  onNext: () => void;
  onBack: () => void;
}

export function PreviewStep({ parsedRows, rowImageMap, onNext, onBack }: Props) {
  const { matchResults, setMatchResults } = useImportContext();
  const { matching, results, runMatching, toggleRow, toggleAll } = useImportMatching();

  useEffect(() => {
    if (parsedRows.length > 0 && results.length === 0) {
      runMatching(parsedRows, rowImageMap);
    }
  }, [parsedRows, rowImageMap, results.length, runMatching]);

  // Sync results to context
  useEffect(() => {
    if (results.length > 0) setMatchResults(results);
  }, [results, setMatchResults]);

  if (matching) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Matching against existing records…</p>
        </CardContent>
      </Card>
    );
  }

  const included = results.filter((r) => r.included);
  const newWorks = included.filter((r) => r.status === "new").length;
  const updates = included.filter((r) => r.status === "update").length;
  const newArtists = new Set(
    included.filter((r) => r.artistStatus === "new" && r.row.artist_name).map((r) => r.row.artist_name.toLowerCase())
  ).size;
  const newLocations = new Set(
    included.filter((r) => r.locationStatus === "new" && r.row.location_full).map((r) => r.row.location_full.toLowerCase())
  ).size;
  const images = included.filter((r) => r.hasImage).length;
  const allChecked = results.length > 0 && results.every((r) => r.included);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary">{included.length} selected</Badge>
        <Badge className="bg-primary text-primary-foreground">{newWorks} new</Badge>
        <Badge className="bg-secondary text-secondary-foreground">{updates} updates</Badge>
        <Badge variant="outline">{newArtists} new artists</Badge>
        <Badge variant="outline">{newLocations} new locations</Badge>
        <Badge variant="outline">{images} images</Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Preview Rows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(!!v)} />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Accession</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((m, i) => (
                  <TableRow key={i} className={m.included ? "" : "opacity-40"}>
                    <TableCell>
                      <Checkbox checked={m.included} onCheckedChange={() => toggleRow(i)} />
                    </TableCell>
                    <TableCell>
                      {m.hasImage ? (
                        <img
                          src={rowImageMap[m.row.rowIndex]?.previewUrl}
                          className="w-10 h-10 object-cover rounded"
                          alt=""
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Badge variant={m.status === "update" ? "secondary" : "default"} className="text-[10px] w-fit">
                          {m.status === "update" ? "Update" : "New"}
                        </Badge>
                        {m.artistStatus === "new" && m.row.artist_name && (
                          <Badge variant="outline" className="text-[10px] w-fit">New artist</Badge>
                        )}
                        {m.locationStatus === "new" && m.row.location_full && (
                          <Badge variant="outline" className="text-[10px] w-fit">New location</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.row.accession_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{m.row.title}</TableCell>
                    <TableCell className="text-sm">{m.row.artist_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{m.row.medium}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{m.row.location_full}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} disabled={included.length === 0}>
          Start Import ({included.length} rows) →
        </Button>
      </div>
    </div>
  );
}

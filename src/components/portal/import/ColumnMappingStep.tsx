import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { autoDetectMapping, applyMapping, getTargetFields, type ColumnMapping, type ParsedRow } from "@/utils/parseExcelRow";

interface Props {
  rawRows: any[][];
  mapping: ColumnMapping;
  setMapping: (m: ColumnMapping) => void;
  hasHeader: boolean;
  setHasHeader: (v: boolean) => void;
  onNext: (parsed: ParsedRow[]) => void;
  onBack: () => void;
}

export function ColumnMappingStep({ rawRows, mapping, setMapping, hasHeader, setHasHeader, onNext, onBack }: Props) {
  useEffect(() => {
    if (Object.keys(mapping).length === 0 && rawRows.length > 0) {
      setMapping(autoDetectMapping(rawRows));
    }
  }, [rawRows, mapping, setMapping]);

  const preview = rawRows.slice(0, 5);
  const colCount = Math.max(...preview.map((r) => r.length), 0);
  const fields = getTargetFields();

  const handleConfirm = () => {
    const parsed = applyMapping(rawRows, mapping, hasHeader);
    onNext(parsed);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Column Mapping</CardTitle>
            <div className="flex items-center gap-2">
              <Switch id="header" checked={hasHeader} onCheckedChange={setHasHeader} />
              <Label htmlFor="header" className="text-sm">Has header row</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: colCount }, (_, i) => (
                    <TableHead key={i} className="min-w-[140px]">
                      <Select
                        value={mapping[i] || "skip"}
                        onValueChange={(v) => setMapping({ ...mapping, [i]: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fields.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f === "skip" ? "— Skip —" : f.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, ri) => (
                  <TableRow key={ri} className={hasHeader && ri === 0 ? "bg-muted/50 font-medium" : ""}>
                    {Array.from({ length: colCount }, (_, ci) => (
                      <TableCell key={ci} className="text-xs py-2 max-w-[200px] truncate">
                        {String(row[ci] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Showing first 5 rows. Assign each column to a target field or skip it.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={handleConfirm}>
          Continue to Preview →
        </Button>
      </div>
    </div>
  );
}

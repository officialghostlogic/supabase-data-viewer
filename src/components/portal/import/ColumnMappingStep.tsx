import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ColumnMapping, TARGET_FIELDS, FIELD_GROUPS, autoDetectMappingFromHeader } from "@/utils/parseExcelRow";

interface Props {
  rawRows: any[][];
  onComplete: (mapping: ColumnMapping, hasHeader: boolean) => void;
  onBack: () => void;
}

export function ColumnMappingStep({ rawRows, onComplete, onBack }: Props) {
  const [hasHeader, setHasHeader] = useState(true);
  const headerRow = rawRows[0] || [];

  const autoMapping = useMemo(() => {
    if (hasHeader) return autoDetectMappingFromHeader(headerRow);
    const m: ColumnMapping = {};
    for (let i = 0; i < headerRow.length; i++) m[i] = "skip";
    return m;
  }, [headerRow, hasHeader]);

  const [mapping, setMapping] = useState<ColumnMapping>(autoMapping);

  useMemo(() => setMapping(autoMapping), [autoMapping]);

  const previewRows = rawRows.slice(hasHeader ? 1 : 0, hasHeader ? 4 : 3);
  const colCount = Math.max(...rawRows.slice(0, 5).map((r) => r.length), 0);

  const updateMapping = (col: number, field: string) => {
    setMapping((prev) => ({ ...prev, [col]: field }));
  };

  const requiredFields = ["title", "accession_number"];
  const mappedFields = new Set(Object.values(mapping).filter((f) => f !== "skip"));
  const missingRequired = requiredFields.filter((f) => !mappedFields.has(f));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-16">Col</th>
                  {hasHeader && <th className="text-left py-2 px-3 font-medium text-muted-foreground">Header</th>}
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Sample values</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground w-48">Map to</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: colCount }, (_, col) => {
                  const isAutoDetected = autoMapping[col] && autoMapping[col] !== "skip" && mapping[col] === autoMapping[col];
                  return (
                    <tr key={col} className="border-b last:border-0">
                      <td className="py-2 px-3 font-mono text-muted-foreground">
                        {String.fromCharCode(65 + col)}
                      </td>
                      {hasHeader && (
                        <td className="py-2 px-3 font-medium">
                          {String(headerRow[col] || "")}
                        </td>
                      )}
                      <td className="py-2 px-3 text-muted-foreground">
                        <div className="flex gap-2 flex-wrap">
                          {previewRows.slice(0, 2).map((row, i) => (
                            <span key={i} className="bg-muted px-1.5 py-0.5 rounded text-xs max-w-[200px] truncate">
                              {String(row[col] || "—")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Select value={mapping[col] || "skip"} onValueChange={(v) => updateMapping(col, v)}>
                            <SelectTrigger className="h-8 text-xs w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(FIELD_GROUPS).map(([group, fields]) => (
                                <div key={group}>
                                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{group}</div>
                                  {fields.map((f) => (
                                    <SelectItem key={f} value={f} className="text-xs pl-4">
                                      {f.replace(/_/g, " ")}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                          {isAutoDetected && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              Auto
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {missingRequired.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-md text-sm">
              Recommended unmapped fields: {missingRequired.map((f) => f.replace(/_/g, " ")).join(", ")}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={() => onComplete(mapping, hasHeader)}>Continue →</Button>
      </div>
    </div>
  );
}

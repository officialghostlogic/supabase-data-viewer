import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle, ImageIcon, AlertCircle } from "lucide-react";
import { parseWorkbook, detectEmbarkFormat } from "@/utils/parseExcelRow";
import extractEmbeddedImages, { type EmbeddedImage } from "@/utils/extractEmbeddedImages";

interface Props {
  onComplete: (rows: any[][], images: Record<number, EmbeddedImage>, fileName: string, sourceSystem: string) => void;
}

export function FileUploadStep({ onComplete }: Props) {
  const [sourceSystem, setSourceSystem] = useState("EmbARK");
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    rows: any[][]; images: Record<number, EmbeddedImage>; fileName: string;
    imageCount: number; isEmbark: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setError(null);
    setParseResult(null);
    try {
      const { rows } = await parseWorkbook(file);
      let images: Record<number, EmbeddedImage> = {};
      let imageCount = 0;

      if (file.name.endsWith(".xlsx")) {
        const result = await extractEmbeddedImages(file);
        images = result.rowImageMap;
        imageCount = result.imageCount;
      }

      const isEmbark = detectEmbarkFormat(rows);
      setParseResult({ rows, images, fileName: file.name, imageCount, isEmbark });
    } catch (e: any) {
      setError(e.message || "Failed to parse file");
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : parseResult
                ? "border-primary/30 bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onFileChange}
              className="hidden"
            />

            {parsing ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Parsing spreadsheet...</p>
              </div>
            ) : parseResult ? (
              <div className="space-y-3">
                <FileSpreadsheet className="h-10 w-10 text-primary mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {parseResult.fileName} — {parseResult.rows.length} rows detected
                  </p>
                  {parseResult.imageCount > 0 ? (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      {parseResult.imageCount} embedded images detected
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No embedded images — upload separately in Step 4
                    </p>
                  )}
                  {parseResult.isEmbark && (
                    <p className="text-xs font-medium text-primary mt-2">
                      EmbARK format detected — columns mapped automatically
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Click to replace file</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium">Drop your EmbARK or Finance spreadsheet here</p>
                  <p className="text-sm text-muted-foreground mt-1">Accepts .csv, .xlsx, .xls</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source system</label>
            <Select value={sourceSystem} onValueChange={setSourceSystem}>
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EmbARK">EmbARK</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => parseResult && onComplete(parseResult.rows, parseResult.images, parseResult.fileName, sourceSystem)}
          disabled={!parseResult}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

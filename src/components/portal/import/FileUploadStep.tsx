import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseWorkbook, autoDetectMapping } from "@/utils/parseExcelRow";
import extractEmbeddedImages, { type EmbeddedImage } from "@/utils/extractEmbeddedImages";

interface Props {
  onParsed: (rows: any[][], images: Record<number, EmbeddedImage>, fileName: string) => void;
}

export function FileUploadStep({ onParsed }: Props) {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".xlsx")) {
        setError("Please upload an .xlsx file");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const [{ rows }, imgResult] = await Promise.all([
          parseWorkbook(file),
          extractEmbeddedImages(file),
        ]);
        onParsed(rows, imgResult.rowImageMap, file.name);
      } catch (err: any) {
        setError(err.message || "Failed to parse file");
      } finally {
        setLoading(false);
      }
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handlePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <label
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <span className="text-sm font-medium">
            {loading ? "Parsing file…" : "Drop an .xlsx file here or click to browse"}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Supports Excel files with embedded images
          </span>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handlePick}
            disabled={loading}
          />
        </label>
        {error && <p className="text-destructive text-sm mt-3">{error}</p>}
      </CardContent>
    </Card>
  );
}

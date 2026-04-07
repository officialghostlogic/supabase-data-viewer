import { useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useImportExecution } from "@/hooks/useImport";
import { useImportMatching } from "@/hooks/useImport";
import type { EmbeddedImage } from "@/utils/extractEmbeddedImages";

// This component receives state from parent via a shared context pattern
// We'll use a simpler approach: the parent passes results via a global ref

import { createContext, useState } from "react";

interface ImportDataContextType {
  results: ReturnType<typeof useImportMatching>["results"];
  setResults: (r: any) => void;
}

export const ImportDataContext = createContext<ImportDataContextType>({
  results: [],
  setResults: () => {},
});

interface Props {
  rowImageMap: Record<number, EmbeddedImage>;
  fileName: string;
  onDone: () => void;
}

export function ExecuteStep({ rowImageMap, fileName, onDone }: Props) {
  const { results } = useContext(ImportDataContext);
  const { progress, done, execute } = useImportExecution();
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    setStarted(true);
    execute(results, rowImageMap, fileName);
  };

  useEffect(() => {
    if (done) {
      const t = setTimeout(onDone, 1500);
      return () => clearTimeout(t);
    }
  }, [done, onDone]);

  const included = results.filter((r) => r.included);

  if (!started) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ready to Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will process <strong>{included.length}</strong> rows from <strong>{fileName}</strong>.
            New artists, locations, and buildings will be created as needed.
            Images will be uploaded to storage.
          </p>
          <Button onClick={handleStart} size="lg">
            Start Import
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!progress) return null;

  const pct = Math.round((progress.current / progress.total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {done ? "Import Complete" : "Importing…"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={pct} className="h-3" />
        <p className="text-sm text-muted-foreground">
          {progress.current} / {progress.total} — {progress.currentLabel}
        </p>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600">✓ {progress.imported} new</span>
          <span className="text-blue-600">↻ {progress.updated} updated</span>
          {progress.errors > 0 && (
            <span className="text-destructive">✕ {progress.errors} errors</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

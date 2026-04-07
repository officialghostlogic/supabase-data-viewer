import { useState, useEffect } from "react";
import { usePortal } from "@/components/portal/PortalContext";
import { FileUploadStep } from "./FileUploadStep";
import { ColumnMappingStep } from "./ColumnMappingStep";
import { PreviewStep } from "./PreviewStep";
import { ExecuteStep } from "./ExecuteStep";
import { ColumnMapping, ProcessedRow, processRows, getEmbarkMapping, detectEmbarkFormat } from "@/utils/parseExcelRow";
import type { EmbeddedImage } from "@/utils/extractEmbeddedImages";
import { revokeImageUrls } from "@/utils/extractEmbeddedImages";
import type { MatchResult } from "@/hooks/useImport";
import { Check } from "lucide-react";

const STEPS = ["Upload File", "Map Columns", "Preview & Clean", "Review & Push"];

export function ImportPage() {
  const { role } = usePortal();
  const accent = role === "admin" ? "text-[hsl(var(--admin-accent))]" : "text-[hsl(var(--staff-accent))]";

  const [step, setStep] = useState(0);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [rowImageMap, setRowImageMap] = useState<Record<number, EmbeddedImage>>({});
  const [fileName, setFileName] = useState("");
  const [sourceSystem, setSourceSystem] = useState("EmbARK");
  const [isEmbark, setIsEmbark] = useState(false);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [hasHeader, setHasHeader] = useState(false);
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  useEffect(() => {
    return () => revokeImageUrls(rowImageMap);
  }, [rowImageMap]);

  const handleFileUploaded = (rows: any[][], images: Record<number, EmbeddedImage>, name: string, system: string) => {
    setRawRows(rows);
    setRowImageMap(images);
    setFileName(name);
    setSourceSystem(system);

    const embark = detectEmbarkFormat(rows);
    setIsEmbark(embark);

    if (embark) {
      const m = getEmbarkMapping();
      setMapping(m);
      setHasHeader(false);
      const processed = processRows(rows, m, false);
      setProcessedRows(processed);
      setStep(2);
    } else {
      setStep(1);
    }
  };

  const handleMappingDone = (m: ColumnMapping, header: boolean) => {
    setMapping(m);
    setHasHeader(header);
    const processed = processRows(rawRows, m, header);
    setProcessedRows(processed);
    setStep(2);
  };

  const handlePreviewNext = (results: MatchResult[]) => {
    setMatchResults(results);
    setStep(3);
  };

  const goToStep = (target: number) => {
    if (target < step) setStep(target);
  };

  const resetWizard = () => {
    revokeImageUrls(rowImageMap);
    setStep(0);
    setRawRows([]);
    setRowImageMap({});
    setFileName("");
    setSourceSystem("EmbARK");
    setIsEmbark(false);
    setMapping({});
    setHasHeader(false);
    setProcessedRows([]);
    setMatchResults([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Works</h1>
        <p className="text-sm text-muted-foreground">Import works, artists, and locations from spreadsheet files</p>
      </div>

      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToStep(i)}
              disabled={i >= step}
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                i < step
                  ? "bg-primary text-primary-foreground cursor-pointer hover:opacity-80"
                  : i === step
                  ? `border-2 border-current ${accent} bg-transparent`
                  : "bg-muted text-muted-foreground cursor-default"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </button>
            <span
              className={`text-xs hidden sm:inline ${i === step ? "font-semibold" : "text-muted-foreground"} ${
                i < step ? "cursor-pointer hover:underline" : ""
              }`}
              onClick={() => goToStep(i)}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {step === 0 && <FileUploadStep onComplete={handleFileUploaded} />}
      {step === 1 && (
        <ColumnMappingStep
          rawRows={rawRows}
          onComplete={handleMappingDone}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <PreviewStep
          processedRows={processedRows}
          rowImageMap={rowImageMap}
          onNext={handlePreviewNext}
          onBack={() => setStep(isEmbark ? 0 : 1)}
        />
      )}
      {step === 3 && (
        <ExecuteStep
          matchResults={matchResults}
          rowImageMap={rowImageMap}
          fileName={fileName}
          sourceSystem={sourceSystem}
          onReset={resetWizard}
        />
      )}
    </div>
  );
}

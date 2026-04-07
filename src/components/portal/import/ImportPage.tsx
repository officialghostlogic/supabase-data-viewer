import { useState } from "react";
import { usePortalContext } from "@/components/portal/PortalContext";
import { FileUploadStep } from "./FileUploadStep";
import { ColumnMappingStep } from "./ColumnMappingStep";
import { PreviewStep } from "./PreviewStep";
import { ExecuteStep } from "./ExecuteStep";
import { ResultsStep } from "./ResultsStep";
import { ParsedRow, ColumnMapping } from "@/utils/parseExcelRow";
import type { EmbeddedImage } from "@/utils/extractEmbeddedImages";

const STEPS = ["Upload", "Map Columns", "Preview", "Import", "Results"];

export function ImportPage() {
  const { role } = usePortalContext();
  const accent = role === "admin" ? "text-[hsl(var(--admin-accent))]" : "text-[hsl(var(--staff-accent))]";

  const [step, setStep] = useState(0);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [hasHeader, setHasHeader] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [rowImageMap, setRowImageMap] = useState<Record<number, EmbeddedImage>>({});
  const [fileName, setFileName] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Works</h1>
        <p className="text-sm text-muted-foreground">Import works, artists, and locations from Excel files</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                  ? `border-2 border-current ${accent} bg-transparent`
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${i === step ? "font-semibold" : "text-muted-foreground"} hidden sm:inline`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <FileUploadStep
          onParsed={(rows, images, name) => {
            setRawRows(rows);
            setRowImageMap(images);
            setFileName(name);
            setStep(1);
          }}
        />
      )}
      {step === 1 && (
        <ColumnMappingStep
          rawRows={rawRows}
          mapping={mapping}
          setMapping={setMapping}
          hasHeader={hasHeader}
          setHasHeader={setHasHeader}
          onNext={(parsed) => {
            setParsedRows(parsed);
            setStep(2);
          }}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <PreviewStep
          parsedRows={parsedRows}
          rowImageMap={rowImageMap}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <ExecuteStep
          rowImageMap={rowImageMap}
          fileName={fileName}
          onDone={() => setStep(4)}
        />
      )}
      {step === 4 && <ResultsStep fileName={fileName} />}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { usePortal } from "@/components/portal/PortalContext";
import { FileUploadStep } from "./FileUploadStep";
import { ColumnMappingStep } from "./ColumnMappingStep";
import { PreviewStep } from "./PreviewStep";
import { ExecuteStep } from "./ExecuteStep";
import { ColumnMapping, ProcessedRow, processRows, getEmbarkMapping, detectEmbarkFormat } from "@/utils/parseExcelRow";
import type { EmbeddedImage } from "@/utils/extractEmbeddedImages";
import { revokeImageUrls } from "@/utils/extractEmbeddedImages";
import extractEmbeddedImages from "@/utils/extractEmbeddedImages";
import type { MatchResult } from "@/hooks/useImport";
import { useImportPersistence, loadPersistedState, clearPersistedState, type PersistedImportState } from "@/hooks/useImportPersistence";
import { Check, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = ["Upload File", "Map Columns", "Preview & Clean", "Review & Push"];

export function ImportPage() {
  const { role } = usePortal();
  const accent = role === "admin" ? "text-[hsl(var(--admin-accent))]" : "text-[hsl(var(--staff-accent))]";
  const { save, clear } = useImportPersistence();

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

  // Persistence tracking
  const [hasImages, setHasImages] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [imagesLost, setImagesLost] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<PersistedImportState | null>(null);
  const [pushing, setPushing] = useState(false);
  const [reuploadMode, setReuploadMode] = useState(false);
  const reuploadRef = useRef<HTMLInputElement>(null);

  // On mount: check for persisted state
  useEffect(() => {
    const saved = loadPersistedState();
    if (saved && saved.currentStep > 0) {
      setPendingRestore(saved);
      setShowResumeBanner(true);
    }
  }, []);

  // Persist state on changes (debounced)
  const persistState = useCallback(() => {
    if (step === 0 && rawRows.length === 0) return;
    const state: PersistedImportState = {
      currentStep: step,
      sourceSystem,
      fileName,
      rowCount: rawRows.length,
      hasImages,
      imageCount,
      isEmbark,
      rawRows,
      mapping,
      hasHeader,
      processedRows,
      matchResults,
      savedAt: Date.now(),
    };
    save(state);
  }, [step, sourceSystem, fileName, rawRows, hasImages, imageCount, isEmbark, mapping, hasHeader, processedRows, matchResults, save]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  // beforeunload guard during push only
  useEffect(() => {
    if (!pushing) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pushing]);

  // Cleanup image URLs on unmount
  useEffect(() => {
    return () => revokeImageUrls(rowImageMap);
  }, [rowImageMap]);

  const restoreState = useCallback((saved: PersistedImportState) => {
    setStep(saved.currentStep);
    setRawRows(saved.rawRows);
    setFileName(saved.fileName);
    setSourceSystem(saved.sourceSystem);
    setIsEmbark(saved.isEmbark);
    setMapping(saved.mapping);
    setHasHeader(saved.hasHeader);
    setProcessedRows(saved.processedRows);
    setMatchResults(saved.matchResults);
    setHasImages(saved.hasImages);
    setImageCount(saved.imageCount);
    setRowImageMap({});
    setImagesLost(saved.hasImages);
    setShowResumeBanner(false);
    setPendingRestore(null);
  }, []);

  const handleContinueImport = () => {
    if (pendingRestore) restoreState(pendingRestore);
  };

  const handleStartOver = () => {
    clear();
    setShowResumeBanner(false);
    setPendingRestore(null);
    resetWizard();
  };

  const handleFileUploaded = (rows: any[][], images: Record<number, EmbeddedImage>, name: string, system: string) => {
    setRawRows(rows);
    setRowImageMap(images);
    setFileName(name);
    setSourceSystem(system);
    const imgCount = Object.keys(images).length;
    setHasImages(imgCount > 0);
    setImageCount(imgCount);
    setImagesLost(false);

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
    clear();
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
    setHasImages(false);
    setImageCount(0);
    setImagesLost(false);
    setPushing(false);
  };

  const handleReuploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.endsWith(".xlsx")) {
        const result = await extractEmbeddedImages(file);
        setRowImageMap(result.rowImageMap);
        setHasImages(result.hasImages);
        setImageCount(result.imageCount);
        setImagesLost(false);
        setReuploadMode(false);
      }
    } catch {
      // Ignore errors — images just stay unavailable
    }
  };

  const hasSavedState = !!loadPersistedState();

  // Resume banner
  if (showResumeBanner && pendingRestore) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Import Works</h1>
          <p className="text-sm text-muted-foreground">Import works, artists, and locations from spreadsheet files</p>
        </div>
        <div className="bg-primary text-primary-foreground rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span className="text-sm">
              You have an import in progress — <strong>{pendingRestore.fileName}</strong>, {pendingRestore.rowCount} rows, Step {pendingRestore.currentStep + 1} of 4.
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleContinueImport}
              className="gap-1"
            >
              Continue import <ArrowRight className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStartOver}
              className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
            >
              Start over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import Works</h1>
          <p className="text-sm text-muted-foreground">Import works, artists, and locations from spreadsheet files</p>
        </div>
        {step === 0 && hasSavedState && (
          <button
            onClick={handleStartOver}
            className="text-xs text-muted-foreground hover:underline"
          >
            Clear saved import
          </button>
        )}
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
        <>
          <input
            ref={reuploadRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleReuploadFile}
            className="hidden"
          />
          <ExecuteStep
            matchResults={matchResults}
            rowImageMap={rowImageMap}
            fileName={fileName}
            sourceSystem={sourceSystem}
            onReset={resetWizard}
            onPushingChange={setPushing}
            imagesLost={imagesLost}
            expectedImageCount={imageCount}
            onReuploadFile={() => reuploadRef.current?.click()}
          />
        </>
      )}
    </div>
  );
}

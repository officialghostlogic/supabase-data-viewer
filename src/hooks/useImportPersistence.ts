import { useCallback, useRef, useEffect } from "react";
import type { ColumnMapping, ProcessedRow } from "@/utils/parseExcelRow";
import type { MatchResult } from "@/hooks/useImport";

const STORAGE_KEY = "pac_import_state";

export interface PersistedImportState {
  currentStep: number;
  sourceSystem: string;
  fileName: string;
  rowCount: number;
  hasImages: boolean;
  imageCount: number;
  isEmbark: boolean;
  rawRows: any[][];
  mapping: ColumnMapping;
  hasHeader: boolean;
  processedRows: ProcessedRow[];
  matchResults: MatchResult[];
  savedAt: number;
}

export function loadPersistedState(): PersistedImportState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedImportState;
    if (parsed.currentStep > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearPersistedState() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function useImportPersistence() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((state: PersistedImportState) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // sessionStorage full or unavailable — ignore
      }
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { save, clear: clearPersistedState };
}

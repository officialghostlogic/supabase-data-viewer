declare const XLSX: any;

export interface ParsedRow {
  rowIndex: number;
  barcode: string;
  accession_number: string;
  date_created: string;
  title: string;
  artist_name: string;
  medium: string;
  location_full: string;
}

export interface ColumnMapping {
  [colIndex: number]: string;
}

const TARGET_FIELDS = [
  "barcode",
  "accession_number",
  "date_created",
  "title",
  "artist_name",
  "medium",
  "location_full",
  "skip",
] as const;

export type TargetField = (typeof TARGET_FIELDS)[number];

export function getTargetFields(): readonly string[] {
  return TARGET_FIELDS;
}

export function parseWorkbook(file: File): Promise<{ rows: any[][]; sheetName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        resolve({ rows, sheetName });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function autoDetectMapping(rows: any[][]): ColumnMapping {
  if (rows.length === 0) return {};
  const sampleRows = rows.slice(0, Math.min(10, rows.length));
  const colCount = Math.max(...sampleRows.map((r) => r.length));
  const mapping: ColumnMapping = {};

  for (let col = 0; col < colCount; col++) {
    const values = sampleRows.map((r) => String(r[col] || "")).filter(Boolean);
    if (values.length === 0) {
      mapping[col] = "skip";
      continue;
    }

    const allNumeric = values.every((v) => /^\d{4,}$/.test(v.trim()));
    if (allNumeric && !Object.values(mapping).includes("barcode")) {
      mapping[col] = "barcode";
      continue;
    }

    const hasAccession = values.some((v) => /^[A-Z]{1,3}[-.]?\d/.test(v.trim()) || /^\d{2}[A-Z]\./.test(v.trim()));
    if (hasAccession && !Object.values(mapping).includes("accession_number")) {
      mapping[col] = "accession_number";
      continue;
    }

    const hasColon = values.some((v) => (v.match(/ : /g) || []).length >= 1);
    if (hasColon && !Object.values(mapping).includes("location_full")) {
      mapping[col] = "location_full";
      continue;
    }

    const hasDate = values.some(
      (v) => /^\d{4}$/.test(v.trim()) || /^[A-Z][a-z]{2}-\d{2}$/.test(v.trim()) || /n\.d\./.test(v)
    );
    if (hasDate && !Object.values(mapping).includes("date_created")) {
      mapping[col] = "date_created";
      continue;
    }

    const hasComma = values.filter((v) => /^[A-Z][a-z]+,\s/.test(v)).length > values.length * 0.3;
    if (hasComma && !Object.values(mapping).includes("artist_name")) {
      mapping[col] = "artist_name";
      continue;
    }

    const mediumWords = ["oil", "canvas", "paper", "print", "acrylic", "watercolor", "photograph", "bronze", "ceramic", "wood", "ink"];
    const hasMedium = values.some((v) => mediumWords.some((w) => v.toLowerCase().includes(w)));
    if (hasMedium && !Object.values(mapping).includes("medium")) {
      mapping[col] = "medium";
      continue;
    }

    if (!Object.values(mapping).includes("title")) {
      mapping[col] = "title";
      continue;
    }

    mapping[col] = "skip";
  }

  return mapping;
}

export function applyMapping(rows: any[][], mapping: ColumnMapping, hasHeader: boolean): ParsedRow[] {
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows
    .map((row, idx) => {
      const parsed: any = { rowIndex: hasHeader ? idx + 1 : idx };
      for (const [colStr, field] of Object.entries(mapping)) {
        if (field === "skip") continue;
        const col = parseInt(colStr, 10);
        parsed[field] = String(row[col] ?? "").trim();
      }
      return parsed as ParsedRow;
    })
    .filter((r) => r.title || r.accession_number || r.barcode);
}

export function parseArtistName(raw: string): { display_name: string; family_name: string; given_name: string } {
  if (!raw) return { display_name: "", family_name: "", given_name: "" };
  const trimmed = raw.trim();
  if (trimmed.includes(",")) {
    const [family, given] = trimmed.split(",", 2);
    return {
      display_name: trimmed,
      family_name: family.trim(),
      given_name: (given || "").trim(),
    };
  }
  return { display_name: trimmed, family_name: "", given_name: trimmed };
}

export function parseLocation(full: string): { building: string; floor: string; room: string } {
  if (!full) return { building: "", floor: "", room: "" };
  const parts = full.split(" : ").map((s) => s.trim());
  return {
    building: parts[0] || "",
    floor: parts[1] || "",
    room: parts[2] || "",
  };
}

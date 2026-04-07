declare const XLSX: any;

export interface ProcessedRow {
  rowIndex: number;
  accession_number: string | null;
  barcode: string | null;
  title: string;
  artist_raw: string | null;
  artist_display: string | null;
  artist_family: string | null;
  artist_given: string | null;
  medium: string | null;
  classification: string | null;
  classification_inferred: boolean;
  date_created: string | null;
  date_acquired: string | null;
  date_year_start: number | null;
  date_year_end: number | null;
  date_certainty: string | null;
  location_full: string | null;
  location_building: string;
  location_floor: string;
  location_room: string;
  dimensions_h: number | null;
  dimensions_w: number | null;
  dimensions_d: number | null;
  dimensions_display: string | null;
  credit_line: string | null;
  provenance: string | null;
  rights_status: string | null;
  notes: string | null;
  subject_tags: string[] | null;
  is_on_display: boolean;
  data_quality_score: number;
  import_flags: string[];
}

export interface ColumnMapping {
  [colIndex: number]: string;
}

export const TARGET_FIELDS = [
  "accession_number", "barcode",
  "title", "artist", "medium", "classification", "date_created", "date_acquired",
  "location",
  "height", "width", "depth", "unit",
  "credit_line", "provenance", "rights_status",
  "notes", "subject_tags", "is_on_display",
  "skip",
] as const;

export type TargetField = (typeof TARGET_FIELDS)[number];

export const FIELD_GROUPS: Record<string, TargetField[]> = {
  "Identification": ["accession_number", "barcode"],
  "Work Details": ["title", "artist", "medium", "classification", "date_created", "date_acquired"],
  "Location": ["location"],
  "Physical": ["height", "width", "depth", "unit"],
  "Provenance": ["credit_line", "provenance", "rights_status"],
  "Other": ["notes", "subject_tags", "is_on_display", "skip"],
};

export const FIELD_ALIASES: Record<string, string[]> = {
  accession_number: ["accession", "serial", "acc_no", "object_number"],
  barcode: ["barcode", "asset", "bar_code"],
  title: ["title", "description", "object_title", "model"],
  artist: ["artist", "manuf", "maker", "creator", "manufacturer"],
  medium: ["media", "make", "materials", "technique"],
  location: ["location", "bldg_room", "gallery", "room"],
  height: ["h", "height", "h_in"],
  width: ["w", "width", "w_in"],
  depth: ["d", "depth"],
  unit: ["unit", "units"],
  credit_line: ["credit", "credit_line", "donor"],
  provenance: ["provenance", "history"],
  rights_status: ["rights", "copyright"],
  notes: ["notes", "comments"],
  subject_tags: ["tags", "subjects", "keywords"],
  is_on_display: ["on_display", "display", "exhibited"],
  classification: ["classification", "class", "type", "category"],
  date_created: ["date_created", "date", "year"],
  date_acquired: ["date_acquired", "acquired"],
};

const EMBARK_MAPPING: ColumnMapping = {
  0: "barcode", 1: "accession_number", 2: "date_created", 3: "title",
  4: "artist", 5: "medium", 6: "location", 7: "skip",
};

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

export function detectEmbarkFormat(rows: any[][]): boolean {
  if (rows.length === 0) return false;
  const firstCell = rows[0][0];
  return typeof firstCell === "number" || /^\d{4,}$/.test(String(firstCell).trim());
}

export function getEmbarkMapping(): ColumnMapping {
  return { ...EMBARK_MAPPING };
}

export function autoDetectMappingFromHeader(headerRow: any[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  for (let col = 0; col < headerRow.length; col++) {
    const header = String(headerRow[col] || "").trim().toUpperCase().replace(/\s+/g, "_");
    if (!header) { mapping[col] = "skip"; continue; }
    let matched = false;
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (used.has(field)) continue;
      if (aliases.some((a) => header === a.toUpperCase() || header.includes(a.toUpperCase()))) {
        mapping[col] = field;
        used.add(field);
        matched = true;
        break;
      }
    }
    if (!matched) mapping[col] = "skip";
  }
  return mapping;
}

// --- Cleaning Functions ---

export function cleanDate(raw: string | number | null): {
  cleaned: string | null; year_start: number | null; year_end: number | null; certainty: string | null;
} {
  if (raw == null || raw === "") return { cleaned: null, year_start: null, year_end: null, certainty: "unknown" };
  let s = String(raw).trim();

  // Excel serial date (number > 10000)
  if (/^\d{5,}$/.test(s)) {
    const d = new Date((parseInt(s) - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      return { cleaned: String(y), year_start: y, year_end: y, certainty: "exact" };
    }
  }

  const ndPatterns = /^(n\.?d\.?|nd|unknown|null|none|undated|\?)$/i;
  if (ndPatterns.test(s) || s === "") return { cleaned: null, year_start: null, year_end: null, certainty: "unknown" };

  // Range: YYYY-YYYY
  const rangeMatch = s.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    return { cleaned: s, year_start: start, year_end: end, certainty: "range" };
  }

  // Decade: YYYYs
  const decadeMatch = s.match(/^(\d{4})s$/i);
  if (decadeMatch) {
    const y = parseInt(decadeMatch[1]);
    return { cleaned: s, year_start: y, year_end: y + 9, certainty: "decade" };
  }

  // Circa
  const circaMatch = s.match(/^(?:circa|ca?\.?|approx\.?)\s*(\d{4})$/i);
  if (circaMatch) {
    const y = parseInt(circaMatch[1]);
    return { cleaned: s, year_start: y, year_end: y, certainty: "circa" };
  }

  // Exact year
  const exactMatch = s.match(/^(\d{4})$/);
  if (exactMatch) {
    const y = parseInt(exactMatch[1]);
    return { cleaned: s, year_start: y, year_end: y, certainty: "exact" };
  }

  // Month-Year format like "Jun-97" or "Jun-2001"
  const monthYear = s.match(/^([A-Za-z]{3})-(\d{2,4})$/);
  if (monthYear) {
    let yr = parseInt(monthYear[2]);
    if (yr < 100) yr += yr > 50 ? 1900 : 2000;
    return { cleaned: String(yr), year_start: yr, year_end: yr, certainty: "exact" };
  }

  // Integer
  const numVal = parseInt(s);
  if (!isNaN(numVal) && numVal > 1000 && numVal < 2100) {
    return { cleaned: String(numVal), year_start: numVal, year_end: numVal, certainty: "exact" };
  }

  return { cleaned: s, year_start: null, year_end: null, certainty: "unknown" };
}

export function parseArtistName(raw: string): {
  display_name: string; family_name: string; given_name: string; name_raw: string;
} {
  if (!raw || !raw.trim()) return { display_name: "", family_name: "", given_name: "", name_raw: "" };
  let trimmed = raw.trim();

  // Title case if all lowercase
  if (trimmed === trimmed.toLowerCase()) {
    trimmed = trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const name_raw = trimmed;

  if (trimmed.includes(",")) {
    const [family, given] = trimmed.split(",", 2);
    const f = family.trim();
    const g = (given || "").trim();
    return { display_name: g ? `${g} ${f}` : f, family_name: f, given_name: g, name_raw };
  }

  return { display_name: trimmed, family_name: "", given_name: trimmed, name_raw };
}

export function cleanMedium(raw: string | null): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/\s{2,}/g, " ");
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function cleanTitle(raw: string | null): { title: string; flags: string[] } {
  if (!raw || !raw.trim()) return { title: "Untitled", flags: ["untitled"] };
  const s = raw.trim();
  if (/^untitled$/i.test(s)) return { title: "untitled", flags: ["untitled"] };
  return { title: s, flags: [] };
}

const CLASSIFICATION_RULES: [RegExp, string][] = [
  [/oil|acrylic on canvas|tempera/i, "Painting"],
  [/etching|lithograph|serigraph|linocut|intaglio/i, "Print"],
  [/archival print|inkjet print|digital photo|photograph/i, "Photography"],
  [/pencil|chalk|charcoal|india ink|watercolor|pastel/i, "Drawing"],
  [/ceramic|stoneware|earthenware|raku|porcelain/i, "Ceramic"],
  [/bronze|steel|iron|aluminum|cast iron/i, "Sculpture"],
  [/fabric|textile|felt|fiber/i, "Textile"],
  [/glass|blown|flint|amberina/i, "Mixed Media"],
];

export function inferClassification(medium: string | null, explicit: string | null): {
  classification: string; inferred: boolean;
} {
  if (explicit && explicit.trim()) return { classification: explicit.trim(), inferred: false };
  if (!medium) return { classification: "Unknown", inferred: true };
  for (const [regex, cls] of CLASSIFICATION_RULES) {
    if (regex.test(medium)) return { classification: cls, inferred: true };
  }
  return { classification: "Unknown", inferred: true };
}

export function formatDimensions(
  h: number | null, w: number | null, d: number | null, unit: string | null
): string | null {
  const parts: string[] = [];
  const u = unit?.toLowerCase() === "inches" || unit === "in" || unit === '"' ? '"' : unit ? ` ${unit}` : '"';
  if (h) parts.push(`${h}${u}`);
  if (w) parts.push(`${w}${u}`);
  if (d) parts.push(`${d}${u}`);
  return parts.length > 0 ? parts.join(" × ") : null;
}

export function calcQualityScore(row: ProcessedRow): number {
  let score = 0;
  if (row.accession_number) score += 20;
  if (row.artist_display && !/^unknown$/i.test(row.artist_display)) score += 20;
  if (row.title !== "untitled" && row.title !== "Untitled") score += 10;
  if (row.classification && row.classification !== "Unknown") score += 10;
  if (row.date_certainty && ["exact", "circa", "range", "decade"].includes(row.date_certainty)) score += 10;
  if (row.dimensions_h || row.dimensions_w) score += 5;
  if (row.credit_line) score += 10;
  if (row.provenance) score += 10;
  if (row.barcode) score += 5;
  return score;
}

export function parseLocation(full: string): { building: string; floor: string; room: string } {
  if (!full) return { building: "", floor: "", room: "" };
  const parts = full.split(" : ").map((s) => s.trim());
  return { building: parts[0] || "", floor: parts[1] || "", room: parts[2] || "" };
}

function parseNum(val: any): number | null {
  if (val == null || val === "") return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function parseTags(val: any): string[] | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  return s.split(/[;,|]/).map((t) => t.trim()).filter(Boolean);
}

function parseBool(val: any): boolean {
  if (val == null) return false;
  const s = String(val).trim().toLowerCase();
  return ["true", "yes", "1", "y", "x"].includes(s);
}

export function processRows(
  rawRows: any[][],
  mapping: ColumnMapping,
  hasHeader: boolean
): ProcessedRow[] {
  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
  return dataRows
    .map((row, idx) => {
      const get = (field: string): any => {
        for (const [colStr, f] of Object.entries(mapping)) {
          if (f === field) return row[parseInt(colStr, 10)] ?? "";
        }
        return "";
      };

      const rawTitle = String(get("title") || "").trim();
      const { title, flags } = cleanTitle(rawTitle);
      const rawArtist = String(get("artist") || "").trim();
      const artist = parseArtistName(rawArtist);
      const rawMedium = cleanMedium(String(get("medium") || ""));
      const explicitClass = String(get("classification") || "").trim() || null;
      const { classification, inferred } = inferClassification(rawMedium, explicitClass);
      const rawDate = get("date_created");
      const { cleaned: dateCleaned, year_start, year_end, certainty } = cleanDate(rawDate);
      const rawLoc = String(get("location") || "").trim();
      const loc = parseLocation(rawLoc);
      const h = parseNum(get("height"));
      const w = parseNum(get("width"));
      const d = parseNum(get("depth"));
      const unit = String(get("unit") || "").trim() || null;
      const dimDisplay = formatDimensions(h, w, d, unit);

      const importFlags = [...flags];
      if (inferred && classification === "Unknown") importFlags.push("class-unknown");

      const processed: ProcessedRow = {
        rowIndex: hasHeader ? idx + 1 : idx,
        accession_number: String(get("accession_number") || "").trim() || null,
        barcode: String(get("barcode") || "").trim() || null,
        title,
        artist_raw: rawArtist || null,
        artist_display: artist.display_name || null,
        artist_family: artist.family_name || null,
        artist_given: artist.given_name || null,
        medium: rawMedium,
        classification,
        classification_inferred: inferred,
        date_created: dateCleaned,
        date_acquired: String(get("date_acquired") || "").trim() || null,
        date_year_start: year_start,
        date_year_end: year_end,
        date_certainty: certainty,
        location_full: rawLoc || null,
        location_building: loc.building,
        location_floor: loc.floor,
        location_room: loc.room,
        dimensions_h: h,
        dimensions_w: w,
        dimensions_d: d,
        dimensions_display: dimDisplay,
        credit_line: String(get("credit_line") || "").trim() || null,
        provenance: String(get("provenance") || "").trim() || null,
        rights_status: String(get("rights_status") || "").trim() || null,
        notes: String(get("notes") || "").trim() || null,
        subject_tags: parseTags(get("subject_tags")),
        is_on_display: parseBool(get("is_on_display")),
        data_quality_score: 0,
        import_flags: importFlags,
      };

      processed.data_quality_score = calcQualityScore(processed);
      return processed;
    })
    .filter((r) => r.title || r.accession_number || r.barcode);
}

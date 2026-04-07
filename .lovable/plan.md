

## Import Page Design Plan

### Understanding the Data

The uploaded Excel file has rows with these columns (no header row):
- **A**: Barcode (e.g., 150152)
- **B**: Accession number (e.g., PM-53718, 01A.04.05)
- **C**: Date created (e.g., 2001, Jun-97, n.d.)
- **D**: Title
- **E**: Artist name (e.g., "Bradley, Carolyn G.")
- **F**: Medium
- **G**: Location string (format: "Building : Floor : Room")
- **H**: Unknown/formula column
- Embedded images per row (extracted via JSZip + drawing XML)

### Architecture

The import page will be a multi-step wizard at `/staff/import` and `/admin/import`.

### Step 1 — File Upload & Parse

- Drag-and-drop zone or file picker accepting `.xlsx` files
- On file selection:
  1. Load with SheetJS (xlsx via CDN) to extract row data
  2. Run `extractEmbeddedImages()` to get `rowImageMap`
- Show parse summary: "[N] rows found, [N] images detected"

### Step 2 — Column Mapping

- Auto-detect columns based on data patterns (accession numbers, location format "X : Y : Z", etc.)
- Show a mapping table: each spreadsheet column → target field dropdown
- Target fields: `barcode`, `accession_number`, `date_created`, `title`, `artist_name`, `medium`, `location_full`, `skip`
- Pre-fill mappings using heuristics; user can override
- "Has header row" toggle (defaults off based on this sample)

### Step 3 — Preview & Validation

- Table showing all parsed rows with mapped field names as headers
- Image thumbnails from `rowImageMap` shown in an "Image" column
- Row-level validation flags:
  - **Match found**: accession_number or barcode matches existing `works` record → "Update" badge
  - **New record**: no match → "New" badge
  - **Artist resolution**: artist_name parsed into family/given name, matched against existing `artists` table by display_name. If no match → "New artist" badge
  - **Location resolution**: location string split on " : " into building/floor/room, matched against existing `buildings` and `locations`. If no match → "New location" badge
- Summary bar: "[N] updates, [N] new works, [N] new artists, [N] new locations, [N] images"
- Row-level checkboxes to include/exclude rows
- Select all / deselect all

### Step 4 — Import Execution

- "Start Import" button with confirmation dialog summarizing what will happen
- Processing logic (sequential per row):
  1. **Artist**: If new artist detected, `INSERT INTO artists (display_name, family_name, given_name, name_raw)`. Cache new artist IDs for reuse across rows.
  2. **Location**: Parse "Building : Floor : Room". Look up or create `buildings` record, then look up or create `locations` record with `building_id`, `building`, `floor`, `room_name`, `full_location`.
  3. **Work**: If existing match (by accession_number), `UPDATE works SET ...`. If new, `INSERT INTO works (...)`. Link `artist_id` and `location_id`.
  4. **Image**: If `rowImageMap` has an image for this row, upload blob to Supabase Storage bucket, then `INSERT INTO digital_assets (work_id, file_url, filename, asset_type, is_primary)`.
- Live progress bar with per-row status updates
- On completion: summary toast and log entry in `import_log`

### Step 5 — Results Summary

- Final report: imported count, updated count, skipped count, errors
- Link to view imported works (filtered by source_file)
- Error details expandable per row

### Storage Requirement

A Supabase Storage bucket (`work-images`) is needed for image uploads. This will require a migration to create the bucket.

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/components/portal/import/ImportPage.tsx` | Create — main wizard container |
| `src/components/portal/import/FileUploadStep.tsx` | Create — drag-drop + parse |
| `src/components/portal/import/ColumnMappingStep.tsx` | Create — field mapping UI |
| `src/components/portal/import/PreviewStep.tsx` | Create — validation table |
| `src/components/portal/import/ExecuteStep.tsx` | Create — progress + execution |
| `src/components/portal/import/ResultsStep.tsx` | Create — final summary |
| `src/hooks/useImport.ts` | Create — import logic, matching, upsert |
| `src/utils/parseExcelRow.ts` | Create — column mapping + artist/location parsing |
| `index.html` | Edit — add SheetJS CDN script |
| `src/App.tsx` | Edit — replace import placeholder route with ImportPage |
| Storage migration | Create `work-images` bucket |

### Technical Details

- **SheetJS (xlsx)**: Added via CDN (`<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js">`) alongside existing JSZip
- **Artist name parsing**: Split "Last, First M." into `family_name` and `given_name`; use original as `name_raw` and `display_name`
- **Location parsing**: Split on " : " delimiter to get building, floor, room; match against existing records
- **Duplicate detection**: Match on `accession_number` first, then `barcode` as fallback
- **Image upload**: Convert blob to File, upload to `work-images/{work_id}/{filename}`, store public URL in `digital_assets`


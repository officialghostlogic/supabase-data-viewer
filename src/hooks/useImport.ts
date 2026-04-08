import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProcessedRow, parseLocation, normalizeArtistName } from "@/utils/parseExcelRow";
import type { EmbeddedImage } from "@/utils/extractEmbeddedImages";

export interface MatchResult {
  row: ProcessedRow;
  status: "new" | "update" | "review" | "skip";
  existingWorkId?: string;
  artistStatus: "existing" | "new";
  existingArtistId?: string;
  locationStatus: "existing" | "new";
  existingLocationId?: string;
  buildingStatus: "existing" | "new";
  existingBuildingId?: string;
  hasImage: boolean;
  included: boolean;
}

export interface ImportProgress {
  phase: string;
  current: number;
  total: number;
  detail: string;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: { row: number; message: string }[];
  artistsCreated: number;
  buildingsCreated: number;
  locationsCreated: number;
  imagesUploaded: number;
}

export function useImportMatching() {
  const [matching, setMatching] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);

  const runMatching = useCallback(
    async (rows: ProcessedRow[], rowImageMap: Record<number, EmbeddedImage>) => {
      setMatching(true);
      try {
        const { data: existingWorks } = await supabase
          .from("works").select("id, accession_number, barcode").is("deleted_at", null);
        const { data: existingArtists } = await supabase
          .from("artists").select("id, display_name").is("deleted_at", null);
        const { data: existingLocations } = await supabase
          .from("locations").select("id, full_location, building_id").is("deleted_at", null);
        const { data: existingBuildings } = await supabase
          .from("buildings").select("id, name").is("deleted_at", null);

        const worksByAcc = new Map<string, string>();
        const worksByBarcode = new Map<string, string>();
        (existingWorks || []).forEach((w) => {
          if (w.accession_number) worksByAcc.set(w.accession_number.toLowerCase(), w.id);
          if (w.barcode) worksByBarcode.set(w.barcode.toLowerCase(), w.id);
        });

        const artistsByName = new Map<string, string>();
        (existingArtists || []).forEach((a) => artistsByName.set(a.display_name.toLowerCase(), a.id));

        const locationsByFull = new Map<string, { id: string; building_id: string | null }>();
        (existingLocations || []).forEach((l) => {
          if (l.full_location) locationsByFull.set(l.full_location.toLowerCase(), { id: l.id, building_id: l.building_id });
        });

        const buildingsByName = new Map<string, string>();
        (existingBuildings || []).forEach((b) => buildingsByName.set(b.name.toLowerCase(), b.id));

        const matched: MatchResult[] = rows.map((row) => {
          let status: MatchResult["status"] = "new";
          let existingWorkId: string | undefined;

          if (row.accession_number) {
            const id = worksByAcc.get(row.accession_number.toLowerCase());
            if (id) { status = "update"; existingWorkId = id; }
          }
          if (!existingWorkId && row.barcode) {
            const id = worksByBarcode.get(row.barcode.toLowerCase());
            if (id) { status = "update"; existingWorkId = id; }
          }
          if (!row.accession_number && !row.barcode) status = "skip";
          else if (!row.accession_number && row.barcode && !existingWorkId) status = "review";

          let artistStatus: "existing" | "new" = "new";
          let existingArtistId: string | undefined;
          if (row.artist_display) {
            const normalized = normalizeArtistName(row.artist_display);
            const lookupName = normalized ? normalized.display_name : row.artist_display;
            const id = artistsByName.get(lookupName.toLowerCase());
            if (id) { artistStatus = "existing"; existingArtistId = id; }
          } else {
            artistStatus = "existing";
          }

          let locationStatus: "existing" | "new" = "new";
          let existingLocationId: string | undefined;
          let buildingStatus: "existing" | "new" = "new";
          let existingBuildingId: string | undefined;

          if (row.location_full) {
            const loc = locationsByFull.get(row.location_full.toLowerCase());
            if (loc) {
              locationStatus = "existing";
              existingLocationId = loc.id;
              existingBuildingId = loc.building_id || undefined;
              buildingStatus = "existing";
            } else {
              const bId = buildingsByName.get(row.location_building.toLowerCase());
              if (bId) { buildingStatus = "existing"; existingBuildingId = bId; }
            }
          } else {
            locationStatus = "existing";
            buildingStatus = "existing";
          }

          return {
            row, status, existingWorkId,
            artistStatus, existingArtistId,
            locationStatus, existingLocationId,
            buildingStatus, existingBuildingId,
            hasImage: !!rowImageMap[row.rowIndex],
            included: status !== "skip",
          };
        });

        setResults(matched);
        return matched;
      } finally {
        setMatching(false);
      }
    },
    []
  );

  const toggleRow = useCallback((idx: number) => {
    setResults((prev) => prev.map((r, i) => (i === idx ? { ...r, included: !r.included } : r)));
  }, []);

  const toggleAll = useCallback((val: boolean) => {
    setResults((prev) => prev.map((r) => (r.status === "skip" ? r : { ...r, included: val })));
  }, []);

  return { matching, results, runMatching, toggleRow, toggleAll, setResults };
}

export function useImportExecution() {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [done, setDone] = useState(false);
  const [postImportData, setPostImportData] = useState<{
    created: number; updated: number; artistsCreated: number;
    buildingsCreated: number; locationsCreated: number; imagesUploaded: number;
    newBuildings: string[];
  } | null>(null);

  const execute = useCallback(
    async (
      results: MatchResult[],
      rowImageMap: Record<number, EmbeddedImage>,
      sourceFile: string,
      sourceSystem: string,
      setToNeedsReview: boolean
    ) => {
      const included = results.filter((r) => r.included);
      const prog: ImportProgress = {
        phase: "", current: 0, total: included.length, detail: "",
        created: 0, updated: 0, skipped: 0, errors: 0, errorDetails: [],
        artistsCreated: 0, buildingsCreated: 0, locationsCreated: 0, imagesUploaded: 0,
      };
      setProgress({ ...prog });
      setDone(false);

      const artistCache = new Map<string, string>();
      const buildingCache = new Map<string, string>();
      const locationCache = new Map<string, string>();
      const newBuildingNames: string[] = [];

      // Pre-populate caches from existing matches
      for (const m of included) {
        if (m.existingArtistId && m.row.artist_display)
          artistCache.set(m.row.artist_display.toLowerCase(), m.existingArtistId);
        if (m.existingBuildingId && m.row.location_building)
          buildingCache.set(m.row.location_building.toLowerCase(), m.existingBuildingId);
        if (m.existingLocationId && m.row.location_full)
          locationCache.set(m.row.location_full.toLowerCase(), m.existingLocationId);
      }

      // 1. Create buildings
      const uniqueBuildings = new Map<string, MatchResult>();
      for (const m of included) {
        if (m.row.location_building && m.buildingStatus === "new" && !buildingCache.has(m.row.location_building.toLowerCase()))
          uniqueBuildings.set(m.row.location_building.toLowerCase(), m);
      }
      prog.phase = "Creating buildings";
      prog.total = uniqueBuildings.size;
      prog.current = 0;
      setProgress({ ...prog });

      for (const [key, m] of uniqueBuildings) {
        prog.current++;
        prog.detail = m.row.location_building;
        setProgress({ ...prog });
        try {
          const { data, error } = await supabase.from("buildings")
            .insert({ name: m.row.location_building, is_active: true })
            .select("id").single();
          if (error) throw error;
          buildingCache.set(key, data.id);
          prog.buildingsCreated++;
          newBuildingNames.push(m.row.location_building);
        } catch (e: any) {
          // May already exist, try to fetch
          const { data } = await supabase.from("buildings")
            .select("id").eq("name", m.row.location_building).single();
          if (data) buildingCache.set(key, data.id);
        }
      }

      // 2. Create locations
      const uniqueLocations = new Map<string, MatchResult>();
      for (const m of included) {
        if (m.row.location_full && m.locationStatus === "new" && !locationCache.has(m.row.location_full.toLowerCase()))
          uniqueLocations.set(m.row.location_full.toLowerCase(), m);
      }
      prog.phase = "Creating rooms";
      prog.total = uniqueLocations.size;
      prog.current = 0;
      setProgress({ ...prog });

      for (const [key, m] of uniqueLocations) {
        prog.current++;
        prog.detail = m.row.location_full || "";
        setProgress({ ...prog });
        try {
          const buildingId = buildingCache.get(m.row.location_building.toLowerCase()) || null;
          const { data, error } = await supabase.from("locations")
            .insert({
              building_id: buildingId,
              building: m.row.location_building || "Unknown",
              floor: m.row.location_floor || null,
              room_name: m.row.location_room || null,
              full_location: m.row.location_full,
            })
            .select("id").single();
          if (error) throw error;
          locationCache.set(key, data.id);
          prog.locationsCreated++;
        } catch (e: any) {
          const { data } = await supabase.from("locations")
            .select("id").eq("full_location", m.row.location_full!).single();
          if (data) locationCache.set(key, data.id);
        }
      }

      // 3. Create artists — build a complete artistMap keyed by normalized display_name
      const artistMap = new Map<string, string>(); // normalized display_name lowercase → id

      // Gather all unique artist display names
      const allArtistNames = new Set<string>();
      for (const m of included) {
        if (m.row.artist_display) allArtistNames.add(m.row.artist_display.toLowerCase());
      }

      prog.phase = "Creating artists";
      prog.total = allArtistNames.size;
      prog.current = 0;
      setProgress({ ...prog });

      for (const key of allArtistNames) {
        prog.current++;
        const sampleRow = included.find(m => m.row.artist_display?.toLowerCase() === key)!.row;
        const displayName = sampleRow.artist_display!;
        prog.detail = displayName;
        setProgress({ ...prog });

        // Check if already exists
        const { data: existing } = await supabase.from("artists")
          .select("id, display_name")
          .eq("display_name", displayName)
          .is("deleted_at", null)
          .maybeSingle();

        if (existing) {
          artistMap.set(key, existing.id);
        } else {
          try {
            const { data: newArtist, error } = await supabase.from("artists")
              .insert({
                display_name: displayName,
                family_name: sampleRow.artist_family || null,
                given_name: sampleRow.artist_given || null,
                name_raw: sampleRow.artist_raw,
                is_isu_affiliated: false,
              })
              .select("id").single();
            if (error) throw error;
            artistMap.set(key, newArtist.id);
            prog.artistsCreated++;
          } catch (e: any) {
            // Race condition fallback
            const { data } = await supabase.from("artists")
              .select("id").eq("display_name", displayName).is("deleted_at", null).maybeSingle();
            if (data) artistMap.set(key, data.id);
          }
        }
      }

      // Also build a complete locationMap
      const locationMap = new Map<string, string>();
      const allLocationKeys = new Set<string>();
      for (const m of included) {
        if (m.row.location_full) allLocationKeys.add(m.row.location_full.toLowerCase());
      }
      for (const key of allLocationKeys) {
        const cached = locationCache.get(key);
        if (cached) {
          locationMap.set(key, cached);
        } else {
          const sampleRow = included.find(m => m.row.location_full?.toLowerCase() === key)!.row;
          const { data } = await supabase.from("locations")
            .select("id").eq("full_location", sampleRow.location_full!).maybeSingle();
          if (data) locationMap.set(key, data.id);
        }
      }

      // 4. Upsert works
      prog.phase = "Saving works";
      prog.total = included.length;
      prog.current = 0;
      setProgress({ ...prog });

      const workIdMap = new Map<number, string>(); // rowIndex → workId

      for (const m of included) {
        prog.current++;
        prog.detail = m.row.title || m.row.accession_number || `Row ${m.row.rowIndex}`;
        setProgress({ ...prog });

        try {
          const artistId = m.row.artist_display
            ? artistMap.get(m.row.artist_display.toLowerCase()) || null
            : null;
          const locationId = m.row.location_full
            ? locationMap.get(m.row.location_full.toLowerCase()) || null
            : null;

          const importStatus = setToNeedsReview ? "needs_review" : "published";

          const workData: any = {
            title: m.row.title || "Untitled",
            barcode: m.row.barcode || null,
            accession_number: m.row.accession_number || null,
            date_created: m.row.date_created || null,
            date_year_start: m.row.date_year_start,
            date_year_end: m.row.date_year_end,
            date_certainty: m.row.date_certainty,
            artist_name: m.row.artist_display || null,
            artist_name_raw: m.row.artist_raw || null,
            artist_id: artistId,
            medium: m.row.medium || null,
            classification: m.row.classification || null,
            classification_inferred: m.row.classification_inferred,
            location_id: locationId,
            location_building: m.row.location_building || null,
            location_floor: m.row.location_floor || null,
            location_room: m.row.location_room || null,
            location_full: m.row.location_full || null,
            dimensions_h: m.row.dimensions_h,
            dimensions_w: m.row.dimensions_w,
            dimensions_d: m.row.dimensions_d,
            dimensions_display: m.row.dimensions_display,
            is_on_display: m.row.is_on_display,
            notes: m.row.notes || null,
            subject_tags: m.row.subject_tags,
            source_file: sourceFile,
            source_system: sourceSystem,
            import_status: importStatus,
            import_flags: m.row.import_flags.length > 0 ? m.row.import_flags : null,
            data_quality_score: m.row.data_quality_score,
          };

          if (m.status === "update" && m.existingWorkId) {
            // Preserve credit_line and provenance with COALESCE logic
            const updates = { ...workData };
            if (!m.row.credit_line) delete updates.credit_line;
            else updates.credit_line = m.row.credit_line;
            if (!m.row.provenance) delete updates.provenance;
            else updates.provenance = m.row.provenance;

            const { error } = await supabase.from("works").update(updates).eq("id", m.existingWorkId);
            if (error) throw new Error(`Work update: ${error.message}`);

            // Manual array append
            // Manual array append
            const { data: existing } = await supabase.from("works").select("source_files").eq("id", m.existingWorkId).single();
            const files = existing?.source_files || [];
            if (!files.includes(sourceFile)) {
              await supabase.from("works").update({ source_files: [...files, sourceFile] }).eq("id", m.existingWorkId);
            }

            workIdMap.set(m.row.rowIndex, m.existingWorkId);
            prog.updated++;
          } else {
            workData.credit_line = m.row.credit_line || null;
            workData.provenance = m.row.provenance || null;
            workData.rights_status = m.row.rights_status || null;
            workData.source_files = [sourceFile];

            const { data, error } = await supabase.from("works").insert(workData).select("id").single();
            if (error) throw new Error(`Work insert: ${error.message}`);
            workIdMap.set(m.row.rowIndex, data.id);
            prog.created++;
          }
        } catch (err: any) {
          prog.errors++;
          prog.errorDetails.push({ row: m.row.rowIndex, message: err.message });
        }
        setProgress({ ...prog });
      }

      // 5. Upload images
      const imageRows = included.filter((m) => rowImageMap[m.row.rowIndex]);
      prog.phase = "Uploading images";
      prog.total = imageRows.length;
      prog.current = 0;
      setProgress({ ...prog });

      for (const m of imageRows) {
        prog.current++;
        prog.detail = m.row.title || "";
        setProgress({ ...prog });

        const img = rowImageMap[m.row.rowIndex];
        const workId = workIdMap.get(m.row.rowIndex);
        if (!img || !workId) continue;

        try {
          const pathPrefix = m.row.accession_number
            ? `works/${m.row.accession_number.replace(/[^a-zA-Z0-9._-]/g, "_")}`
            : `works/barcode-${m.row.barcode || m.row.rowIndex}`;
          const filePath = `${pathPrefix}/primary.${img.ext}`;
          const file = new File([img.blob], `primary.${img.ext}`, { type: img.mimeType });

          const { error: uploadErr } = await supabase.storage
            .from("artwork-images")
            .upload(filePath, file, { upsert: true });
          if (uploadErr) throw new Error(`Upload: ${uploadErr.message}`);

          const { data: urlData } = supabase.storage.from("artwork-images").getPublicUrl(filePath);

          // 6. Save digital asset
          const { error: assetErr } = await supabase.from("digital_assets").insert({
            work_id: workId,
            file_url: urlData.publicUrl,
            filename: `primary.${img.ext}`,
            asset_type: "image",
            is_primary: true,
          });
          if (assetErr) throw new Error(`Asset: ${assetErr.message}`);
          prog.imagesUploaded++;
        } catch (err: any) {
          prog.errors++;
          prog.errorDetails.push({ row: m.row.rowIndex, message: err.message });
        }
        setProgress({ ...prog });
      }

      // 7. Log import
      prog.phase = "Logging import";
      setProgress({ ...prog });
      await supabase.from("import_log").insert({
        source_file: sourceFile,
        source_system: sourceSystem,
        total_rows: included.length,
        imported: prog.created,
        skipped: prog.skipped,
        errors: prog.errors,
        notes: `Updated: ${prog.updated}, Artists: ${prog.artistsCreated}, Buildings: ${prog.buildingsCreated}, Images: ${prog.imagesUploaded}`,
      });

      setPostImportData({
        created: prog.created, updated: prog.updated,
        artistsCreated: prog.artistsCreated, buildingsCreated: prog.buildingsCreated,
        locationsCreated: prog.locationsCreated, imagesUploaded: prog.imagesUploaded,
        newBuildings: newBuildingNames,
      });
      setDone(true);
      setProgress({ ...prog, phase: "Complete" });
    },
    []
  );

  return { progress, done, postImportData, execute };
}

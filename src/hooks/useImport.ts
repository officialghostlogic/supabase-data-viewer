import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParsedRow, parseArtistName, parseLocation } from "@/utils/parseExcelRow";
import type { EmbeddedImage } from "@/utils/extractEmbeddedImages";

export interface MatchResult {
  row: ParsedRow;
  status: "new" | "update";
  existingWorkId?: string;
  artistStatus: "existing" | "new";
  existingArtistId?: string;
  locationStatus: "existing" | "new";
  existingLocationId?: string;
  existingBuildingId?: string;
  hasImage: boolean;
  included: boolean;
}

export interface ImportProgress {
  current: number;
  total: number;
  currentLabel: string;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: { row: number; message: string }[];
}

export function useImportMatching() {
  const [matching, setMatching] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);

  const runMatching = useCallback(
    async (rows: ParsedRow[], rowImageMap: Record<number, EmbeddedImage>) => {
      setMatching(true);
      try {
        const { data: existingWorks } = await supabase
          .from("works")
          .select("id, accession_number, barcode");
        const { data: existingArtists } = await supabase
          .from("artists")
          .select("id, display_name");
        const { data: existingLocations } = await supabase
          .from("locations")
          .select("id, full_location, building_id");
        const { data: existingBuildings } = await supabase
          .from("buildings")
          .select("id, name");

        const worksByAcc = new Map<string, string>();
        const worksByBarcode = new Map<string, string>();
        (existingWorks || []).forEach((w) => {
          if (w.accession_number) worksByAcc.set(w.accession_number.toLowerCase(), w.id);
          if (w.barcode) worksByBarcode.set(w.barcode.toLowerCase(), w.id);
        });

        const artistsByName = new Map<string, string>();
        (existingArtists || []).forEach((a) => {
          artistsByName.set(a.display_name.toLowerCase(), a.id);
        });

        const locationsByFull = new Map<string, { id: string; building_id: string | null }>();
        (existingLocations || []).forEach((l) => {
          if (l.full_location) locationsByFull.set(l.full_location.toLowerCase(), { id: l.id, building_id: l.building_id });
        });

        const buildingsByName = new Map<string, string>();
        (existingBuildings || []).forEach((b) => {
          buildingsByName.set(b.name.toLowerCase(), b.id);
        });

        const matched: MatchResult[] = rows.map((row) => {
          let status: "new" | "update" = "new";
          let existingWorkId: string | undefined;

          if (row.accession_number) {
            const id = worksByAcc.get(row.accession_number.toLowerCase());
            if (id) { status = "update"; existingWorkId = id; }
          }
          if (!existingWorkId && row.barcode) {
            const id = worksByBarcode.get(row.barcode.toLowerCase());
            if (id) { status = "update"; existingWorkId = id; }
          }

          let artistStatus: "existing" | "new" = "new";
          let existingArtistId: string | undefined;
          if (row.artist_name) {
            const id = artistsByName.get(row.artist_name.trim().toLowerCase());
            if (id) { artistStatus = "existing"; existingArtistId = id; }
          } else {
            artistStatus = "existing";
          }

          let locationStatus: "existing" | "new" = "new";
          let existingLocationId: string | undefined;
          let existingBuildingId: string | undefined;
          if (row.location_full) {
            const loc = locationsByFull.get(row.location_full.toLowerCase());
            if (loc) {
              locationStatus = "existing";
              existingLocationId = loc.id;
              existingBuildingId = loc.building_id || undefined;
            } else {
              const parsed = parseLocation(row.location_full);
              const bId = buildingsByName.get(parsed.building.toLowerCase());
              if (bId) existingBuildingId = bId;
            }
          } else {
            locationStatus = "existing";
          }

          return {
            row,
            status,
            existingWorkId,
            artistStatus,
            existingArtistId,
            locationStatus,
            existingLocationId,
            existingBuildingId,
            hasImage: !!rowImageMap[row.rowIndex],
            included: true,
          };
        });

        setResults(matched);
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
    setResults((prev) => prev.map((r) => ({ ...r, included: val })));
  }, []);

  return { matching, results, runMatching, toggleRow, toggleAll, setResults };
}

export function useImportExecution() {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [done, setDone] = useState(false);

  const execute = useCallback(
    async (
      results: MatchResult[],
      rowImageMap: Record<number, EmbeddedImage>,
      sourceFile: string
    ) => {
      const included = results.filter((r) => r.included);
      const prog: ImportProgress = {
        current: 0,
        total: included.length,
        currentLabel: "",
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        errorDetails: [],
      };
      setProgress({ ...prog });
      setDone(false);

      const artistCache = new Map<string, string>();
      const buildingCache = new Map<string, string>();
      const locationCache = new Map<string, string>();

      for (let i = 0; i < included.length; i++) {
        const m = included[i];
        prog.current = i + 1;
        prog.currentLabel = m.row.title || m.row.accession_number || `Row ${m.row.rowIndex}`;
        setProgress({ ...prog });

        try {
          // 1. Artist
          let artistId = m.existingArtistId;
          if (!artistId && m.row.artist_name) {
            const key = m.row.artist_name.trim().toLowerCase();
            if (artistCache.has(key)) {
              artistId = artistCache.get(key)!;
            } else {
              const parsed = parseArtistName(m.row.artist_name);
              const { data, error } = await supabase
                .from("artists")
                .insert({
                  display_name: parsed.display_name,
                  family_name: parsed.family_name || null,
                  given_name: parsed.given_name || null,
                  name_raw: m.row.artist_name,
                })
                .select("id")
                .single();
              if (error) throw new Error(`Artist insert: ${error.message}`);
              artistId = data.id;
              artistCache.set(key, artistId);
            }
          }

          // 2. Location
          let locationId = m.existingLocationId;
          let locBuilding = "";
          let locFloor = "";
          let locRoom = "";
          let locFull = m.row.location_full;

          if (!locationId && m.row.location_full) {
            const locKey = m.row.location_full.toLowerCase();
            if (locationCache.has(locKey)) {
              locationId = locationCache.get(locKey)!;
            } else {
              const parsed = parseLocation(m.row.location_full);
              locBuilding = parsed.building;
              locFloor = parsed.floor;
              locRoom = parsed.room;

              let buildingId = m.existingBuildingId;
              if (!buildingId && parsed.building) {
                const bKey = parsed.building.toLowerCase();
                if (buildingCache.has(bKey)) {
                  buildingId = buildingCache.get(bKey)!;
                } else {
                  const { data, error } = await supabase
                    .from("buildings")
                    .insert({ name: parsed.building })
                    .select("id")
                    .single();
                  if (error) throw new Error(`Building insert: ${error.message}`);
                  buildingId = data.id;
                  buildingCache.set(bKey, buildingId);
                }
              }

              const { data, error } = await supabase
                .from("locations")
                .insert({
                  building_id: buildingId || null,
                  building: parsed.building || "Unknown",
                  floor: parsed.floor || null,
                  room_name: parsed.room || null,
                  full_location: m.row.location_full,
                })
                .select("id")
                .single();
              if (error) throw new Error(`Location insert: ${error.message}`);
              locationId = data.id;
              locationCache.set(locKey, locationId);
            }
          } else if (locationId) {
            const parsed = parseLocation(m.row.location_full);
            locBuilding = parsed.building;
            locFloor = parsed.floor;
            locRoom = parsed.room;
          }

          // 3. Work
          const workData: any = {
            title: m.row.title || "Untitled",
            barcode: m.row.barcode || null,
            accession_number: m.row.accession_number || null,
            date_created: m.row.date_created || null,
            artist_name: m.row.artist_name || null,
            artist_name_raw: m.row.artist_name || null,
            artist_id: artistId || null,
            medium: m.row.medium || null,
            location_id: locationId || null,
            location_building: locBuilding || null,
            location_floor: locFloor || null,
            location_room: locRoom || null,
            location_full: locFull || null,
            source_file: sourceFile,
            import_status: "published",
          };

          let workId: string;
          if (m.status === "update" && m.existingWorkId) {
            const { error } = await supabase.from("works").update(workData).eq("id", m.existingWorkId);
            if (error) throw new Error(`Work update: ${error.message}`);
            workId = m.existingWorkId;
            prog.updated++;
          } else {
            const { data, error } = await supabase.from("works").insert(workData).select("id").single();
            if (error) throw new Error(`Work insert: ${error.message}`);
            workId = data.id;
            prog.imported++;
          }

          // 4. Image
          const img = rowImageMap[m.row.rowIndex];
          if (img) {
            const filePath = `${workId}/${img.filename}`;
            const file = new File([img.blob], img.filename, { type: img.mimeType });
            const { error: uploadErr } = await supabase.storage.from("work-images").upload(filePath, file, { upsert: true });
            if (uploadErr) throw new Error(`Image upload: ${uploadErr.message}`);

            const { data: urlData } = supabase.storage.from("work-images").getPublicUrl(filePath);

            await supabase.from("digital_assets").insert({
              work_id: workId,
              file_url: urlData.publicUrl,
              filename: img.filename,
              asset_type: "image",
              is_primary: true,
            });
          }
        } catch (err: any) {
          prog.errors++;
          prog.errorDetails.push({ row: m.row.rowIndex, message: err.message });
        }

        setProgress({ ...prog });
      }

      // Log import
      await supabase.from("import_log").insert({
        source_file: sourceFile,
        source_system: "Excel Import",
        total_rows: included.length,
        imported: prog.imported,
        skipped: prog.skipped,
        errors: prog.errors,
        notes: `Updated: ${prog.updated}`,
      });

      setDone(true);
    },
    []
  );

  return { progress, done, execute };
}

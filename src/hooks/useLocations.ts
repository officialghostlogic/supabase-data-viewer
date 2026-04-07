import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BuildingWithStats {
  id: string;
  name: string;
  short_name: string | null;
  address: string | null;
  campus_area: string | null;
  description: string | null;
  notes: string | null;
  is_active: boolean | null;
  year_built: number | null;
  primary_contact: string | null;
  building_code: string | null;
  room_count: number;
  work_count: number;
  floors: string[];
}

export interface RoomWithStats {
  id: string;
  floor: string | null;
  room_name: string | null;
  room_code: string | null;
  full_location: string | null;
  location_type: string | null;
  climate_controlled: boolean | null;
  security_level: string | null;
  notes: string | null;
  work_count: number;
}

export function useBuildingsIndex() {
  return useQuery({
    queryKey: ["buildings-index"],
    queryFn: async (): Promise<BuildingWithStats[]> => {
      const { data: buildings, error: bErr } = await supabase
        .from("buildings")
        .select("*")
        .order("name");
      if (bErr) throw bErr;

      const { data: locations, error: lErr } = await supabase
        .from("locations")
        .select("id, building_id, floor");
      if (lErr) throw lErr;

      const { data: works, error: wErr } = await supabase
        .from("works")
        .select("id, location_id");
      if (wErr) throw wErr;

      const locationsByBuilding = new Map<string, typeof locations>();
      for (const l of locations || []) {
        if (!l.building_id) continue;
        const arr = locationsByBuilding.get(l.building_id) || [];
        arr.push(l);
        locationsByBuilding.set(l.building_id, arr);
      }

      const locationIds = new Set((locations || []).map((l) => l.id));
      const worksByLocation = new Map<string, number>();
      for (const w of works || []) {
        if (w.location_id && locationIds.has(w.location_id)) {
          worksByLocation.set(w.location_id, (worksByLocation.get(w.location_id) || 0) + 1);
        }
      }

      return (buildings || []).map((b) => {
        const bLocs = locationsByBuilding.get(b.id) || [];
        const bLocIds = new Set(bLocs.map((l) => l.id));
        let workCount = 0;
        for (const [locId, count] of worksByLocation) {
          if (bLocIds.has(locId)) workCount += count;
        }
        const floors = [...new Set(bLocs.map((l) => l.floor).filter(Boolean) as string[])].sort();
        return {
          ...b,
          room_count: bLocs.length,
          work_count: workCount,
          floors,
        };
      });
    },
  });
}

export function useBuildingDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["building-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: building, error: bErr } = await supabase
        .from("buildings")
        .select("*")
        .eq("id", id!)
        .single();
      if (bErr) throw bErr;

      const { data: locations, error: lErr } = await supabase
        .from("locations")
        .select("*")
        .eq("building_id", id!)
        .order("floor")
        .order("room_name");
      if (lErr) throw lErr;

      const locationIds = (locations || []).map((l) => l.id);
      let worksByLocation = new Map<string, number>();
      let onDisplayCount = 0;

      if (locationIds.length > 0) {
        const { data: works, error: wErr } = await supabase
          .from("works")
          .select("id, location_id, is_on_display")
          .in("location_id", locationIds);
        if (wErr) throw wErr;
        for (const w of works || []) {
          if (w.location_id) {
            worksByLocation.set(w.location_id, (worksByLocation.get(w.location_id) || 0) + 1);
          }
          if (w.is_on_display) onDisplayCount++;
        }
      }

      const rooms: RoomWithStats[] = (locations || []).map((l) => ({
        id: l.id,
        floor: l.floor,
        room_name: l.room_name,
        room_code: l.room_code,
        full_location: l.full_location,
        location_type: l.location_type,
        climate_controlled: l.climate_controlled,
        security_level: l.security_level,
        notes: l.notes,
        work_count: worksByLocation.get(l.id) || 0,
      }));

      const totalWorks = Array.from(worksByLocation.values()).reduce((a, b) => a + b, 0);

      return { building, rooms, totalWorks, onDisplayCount };
    },
  });
}

export function useCreateBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      short_name?: string;
      address?: string;
      campus_area?: string;
      description?: string;
      notes?: string;
      is_active?: boolean;
    }) => {
      const { data: row, error } = await supabase.from("buildings").insert(data).select().single();
      if (error) throw error;
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buildings-index"] }),
  });
}

export function useUpdateBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; short_name?: string | null; address?: string | null; campus_area?: string | null; description?: string | null; notes?: string | null; is_active?: boolean }) => {
      const { error } = await supabase.from("buildings").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buildings-index"] });
      qc.invalidateQueries({ queryKey: ["building-detail"] });
    },
  });
}

export function useRoomDetail(locationId: string | undefined) {
  return useQuery({
    queryKey: ["room-detail", locationId],
    enabled: !!locationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("id", locationId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useRoomWorks(locationId: string | undefined) {
  return useQuery({
    queryKey: ["room-works", locationId],
    enabled: !!locationId,
    queryFn: async () => {
      const { data: works, error } = await supabase
        .from("works")
        .select("id, title, accession_number, artist_name, classification, medium, date_created, is_on_display, data_quality_score")
        .eq("location_id", locationId!)
        .order("title");
      if (error) throw error;

      // Get primary images
      const workIds = (works ?? []).map((w) => w.id);
      let imageMap = new Map<string, string>();
      if (workIds.length > 0) {
        const { data: assets } = await supabase
          .from("digital_assets")
          .select("work_id, file_url")
          .in("work_id", workIds)
          .eq("is_primary", true);
        for (const a of assets ?? []) {
          imageMap.set(a.work_id, a.file_url);
        }
      }

      return (works ?? []).map((w) => ({
        ...w,
        image_url: imageMap.get(w.id) ?? null,
      }));
    },
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      room_name?: string | null;
      room_code?: string | null;
      floor?: string | null;
      location_type?: string | null;
      climate_controlled?: boolean;
      security_level?: string;
      notes?: string | null;
      full_location?: string;
    }) => {
      const { error } = await supabase.from("locations").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["room-detail"] });
      qc.invalidateQueries({ queryKey: ["building-detail"] });
      qc.invalidateQueries({ queryKey: ["buildings-index"] });
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      building_id: string;
      building: string;
      floor?: string;
      room_name?: string;
      room_code?: string;
      full_location?: string;
      location_type?: string;
      climate_controlled?: boolean;
      security_level?: string;
      notes?: string;
    }) => {
      const { data: row, error } = await supabase.from("locations").insert(data).select().single();
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["building-detail"] });
      qc.invalidateQueries({ queryKey: ["buildings-index"] });
    },
  });
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCreateRoom, useCreateBuilding } from "@/hooks/useLocations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel,
} from "@/components/ui/select";
import { toast } from "sonner";

interface LocationPickerProps {
  draft: Record<string, unknown>;
  setDraft: (key: string, value: unknown) => void;
  work: { location_id: string | null; location_building: string | null };
}

function useActiveBuildings() {
  return useQuery({
    queryKey: ["active-buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("id, name, short_name")
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

function useRoomsForBuilding(buildingId: string | null) {
  return useQuery({
    queryKey: ["rooms-for-building", buildingId],
    enabled: !!buildingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, floor, room_name, full_location")
        .eq("building_id", buildingId!)
        .is("deleted_at", null)
        .order("floor")
        .order("room_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function LocationPicker({ draft, setDraft, work }: LocationPickerProps) {
  const { data: buildings } = useActiveBuildings();
  const createBuilding = useCreateBuilding();
  const createRoom = useCreateRoom();

  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [addingBuilding, setAddingBuilding] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState("");
  const [addingRoom, setAddingRoom] = useState(false);
  const [newRoomFloor, setNewRoomFloor] = useState("");
  const [newRoomName, setNewRoomName] = useState("");

  const { data: rooms } = useRoomsForBuilding(selectedBuildingId);

  useEffect(() => {
    if (!buildings || selectedBuildingId) return;
    if (draft.location_id && rooms) return;
    const currentLocId = (draft.location_id as string) || work.location_id;
    if (currentLocId && buildings.length > 0) {
      supabase.from("locations").select("building_id").eq("id", currentLocId).single()
        .then(({ data }) => {
          if (data?.building_id) setSelectedBuildingId(data.building_id);
        });
    }
  }, [buildings, work.location_id, draft.location_id]);

  const handleBuildingChange = (val: string) => {
    if (val === "__add_new__") {
      setAddingBuilding(true);
      return;
    }
    setSelectedBuildingId(val);
    setDraft("location_id", null);
    setDraft("location_building", buildings?.find((b) => b.id === val)?.name ?? null);
    setDraft("location_floor", null);
    setDraft("location_room", null);
    setDraft("location_full", null);
  };

  const handleRoomChange = (val: string) => {
    if (val === "__add_new__") {
      setAddingRoom(true);
      return;
    }
    const room = rooms?.find((r) => r.id === val);
    if (room) {
      setDraft("location_id", room.id);
      setDraft("location_floor", room.floor);
      setDraft("location_room", room.room_name);
      setDraft("location_full", room.full_location);
    }
  };

  const handleAddBuilding = async () => {
    if (!newBuildingName.trim()) return;
    const row = await createBuilding.mutateAsync({ name: newBuildingName.trim() });
    setSelectedBuildingId(row.id);
    setDraft("location_building", row.name);
    setAddingBuilding(false);
    setNewBuildingName("");
    toast.success("Building added");
  };

  const handleAddRoom = async () => {
    if (!selectedBuildingId || !newRoomName.trim()) return;
    const bName = buildings?.find((b) => b.id === selectedBuildingId)?.name ?? "";
    const fullLocation = [bName, newRoomFloor, newRoomName].filter(Boolean).join(" : ");
    const row = await createRoom.mutateAsync({
      building_id: selectedBuildingId,
      building: bName,
      floor: newRoomFloor || undefined,
      room_name: newRoomName.trim(),
      full_location: fullLocation,
    });
    setDraft("location_id", row.id);
    setDraft("location_floor", newRoomFloor || null);
    setDraft("location_room", newRoomName.trim());
    setDraft("location_full", fullLocation);
    setAddingRoom(false);
    setNewRoomFloor("");
    setNewRoomName("");
    toast.success("Room added");
  };

  const floorGroups = new Map<string, typeof rooms>();
  for (const r of rooms ?? []) {
    const key = r.floor ?? "Unassigned";
    const arr = floorGroups.get(key) || [];
    arr.push(r);
    floorGroups.set(key, arr);
  }

  const selectedLocationId = (draft.location_id as string) || "";

  return (
    <div className="space-y-2">
      <Label className="text-xs">Building</Label>
      {addingBuilding ? (
        <div className="flex gap-2">
          <Input value={newBuildingName} onChange={(e) => setNewBuildingName(e.target.value)} placeholder="Building name" className="h-8 text-sm" />
          <Button size="sm" variant="outline" onClick={handleAddBuilding} disabled={createBuilding.isPending}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingBuilding(false)}>Cancel</Button>
        </div>
      ) : (
        <Select value={selectedBuildingId ?? ""} onValueChange={handleBuildingChange}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select building" /></SelectTrigger>
          <SelectContent>
            {buildings?.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}{b.short_name ? ` (${b.short_name})` : ""}
              </SelectItem>
            ))}
            <SelectItem value="__add_new__" className="text-muted-foreground">+ Add new building…</SelectItem>
          </SelectContent>
        </Select>
      )}

      {selectedBuildingId && !addingBuilding && (
        <>
          <Label className="text-xs mt-2">Room</Label>
          {addingRoom ? (
            <div className="space-y-2">
              <Input value={newRoomFloor} onChange={(e) => setNewRoomFloor(e.target.value)} placeholder="Floor (e.g. First Floor)" className="h-8 text-sm" />
              <div className="flex gap-2">
                <Input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Room name" className="h-8 text-sm" />
                <Button size="sm" variant="outline" onClick={handleAddRoom} disabled={createRoom.isPending}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingRoom(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Select value={selectedLocationId} onValueChange={handleRoomChange}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select room" /></SelectTrigger>
              <SelectContent>
                {[...floorGroups.entries()].map(([floor, floorRooms]) => (
                  <SelectGroup key={floor}>
                    <SelectLabel className="text-xs">{floor}</SelectLabel>
                    {floorRooms!.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.room_name || "Unnamed room"}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                <SelectItem value="__add_new__" className="text-muted-foreground">+ Add new room…</SelectItem>
              </SelectContent>
            </Select>
          )}
        </>
      )}
    </div>
  );
}

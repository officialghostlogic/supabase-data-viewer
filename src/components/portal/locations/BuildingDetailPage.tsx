import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Snowflake, Lock, Plus, Image, DoorOpen, Eye, Archive, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { usePortal } from "@/components/portal/PortalContext";
import { useBuildingDetail, useCreateRoom } from "@/hooks/useLocations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import type { RoomWithStats } from "@/hooks/useLocations";

const FLOOR_ORDER = ["Lower Level", "First Floor", "Second Floor", "Third Floor"];
const LOCATION_TYPES = ["Gallery", "Storage", "Conservation Lab", "On Loan", "Off Site", "Registrar", "Admin", "Other"];
const SECURITY_LEVELS = ["Standard", "Restricted", "High Security"];

function sortFloors(floors: string[]): string[] {
  return [...floors].sort((a, b) => {
    const ai = FLOOR_ORDER.indexOf(a);
    const bi = FLOOR_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

function typeColor(t: string | null) {
  switch (t) {
    case "Gallery": return "bg-blue-100 text-blue-800";
    case "Storage": return "bg-amber-100 text-amber-800";
    case "Conservation Lab": return "bg-purple-100 text-purple-800";
    case "On Loan": case "Off Site": return "bg-gray-100 text-gray-600";
    case "Registrar": case "Admin": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}

export function BuildingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accentColor, basePath } = usePortal();
  const { data, isLoading } = useBuildingDetail(id);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [addRoomFloor, setAddRoomFloor] = useState<string | undefined>();

  // Floor grouping
  const { floorKeys, floorMap } = useMemo(() => {
    if (!data) return { floorKeys: [] as string[], floorMap: new Map<string, RoomWithStats[]>() };
    const map = new Map<string, RoomWithStats[]>();
    for (const r of data.rooms) {
      const key = r.floor ?? "__unassigned__";
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    const keys = sortFloors([...map.keys()].filter((k) => k !== "__unassigned__"));
    if (map.has("__unassigned__")) keys.push("__unassigned__");
    return { floorKeys: keys, floorMap: map };
  }, [data]);

  // Collapse state: all expanded by default
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleFloor = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const collapseAll = () => setCollapsed(new Set(floorKeys));
  const expandAll = () => setCollapsed(new Set());

  if (isLoading) return <p className="text-muted-foreground p-6">Loading…</p>;
  if (!data) return <p className="text-muted-foreground p-6">Building not found.</p>;

  const { building, rooms, totalWorks, onDisplayCount } = data;
  const storageCount = totalWorks - onDisplayCount;
  const existingFloors = [...new Set(rooms.map((r) => r.floor).filter(Boolean) as string[])];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <Link to={`${basePath}/locations`} className="hover:underline" style={{ color: accentColor }}>Locations</Link>
        <span className="mx-1.5">→</span>
        <span className="text-foreground font-medium">{building.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{building.name}</h1>
            {building.short_name && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-0">{building.short_name}</Badge>
            )}
          </div>
          {building.address && <p className="text-sm text-muted-foreground mt-0.5">{building.address}</p>}
        </div>
        <div className="flex gap-2">
          <Dialog open={addRoomOpen} onOpenChange={(v) => { setAddRoomOpen(v); if (!v) setAddRoomFloor(undefined); }}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: accentColor, color: "#fff" }}>
                <Plus className="h-4 w-4 mr-1" /> Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Room to {building.name}</DialogTitle></DialogHeader>
              <AddRoomForm
                buildingId={building.id}
                buildingName={building.name}
                existingFloors={existingFloors}
                defaultFloor={addRoomFloor}
                accentColor={accentColor}
                onDone={() => { setAddRoomOpen(false); setAddRoomFloor(undefined); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap items-center">
        <StatChip icon={Image} label={`${totalWorks} total works`} accent={accentColor} />
        <StatChip icon={DoorOpen} label={`${rooms.length} rooms`} accent={accentColor} />
        <StatChip icon={Eye} label={`${onDisplayCount} on display`} accent={accentColor} />
        <StatChip icon={Archive} label={`${storageCount} in storage`} accent={accentColor} />
        <div className="ml-auto flex gap-2">
          <button onClick={expandAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronsUpDown className="h-3.5 w-3.5" /> Expand all
          </button>
          <button onClick={collapseAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronsDownUp className="h-3.5 w-3.5" /> Collapse all
          </button>
        </div>
      </div>

      {/* Floor sections */}
      {floorKeys.map((floorKey) => {
        const floorRooms = floorMap.get(floorKey) || [];
        const floorLabel = floorKey === "__unassigned__" ? "Unassigned" : floorKey;
        const isOpen = !collapsed.has(floorKey);
        const floorWorkCount = floorRooms.reduce((s, r) => s + r.work_count, 0);

        return (
          <Collapsible key={floorKey} open={isOpen} onOpenChange={() => toggleFloor(floorKey)}>
            <div className="space-y-3">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-3 w-full text-left group">
                  {isOpen
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  }
                  <h2 className="text-lg font-semibold group-hover:text-foreground">{floorLabel}</h2>
                  <Separator className="flex-1" />
                  {!isOpen && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {floorRooms.length} rooms · {floorWorkCount} works
                    </span>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {floorRooms.map((r) => (
                    <Link
                      key={r.id}
                      to={`${basePath}/locations/${id}/${r.id}`}
                      className="block"
                    >
                      <Card className="cursor-pointer hover:border-accent transition-colors h-full">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {r.room_name || <span className="italic text-muted-foreground">Unnamed room</span>}
                            </span>
                            <div className="flex gap-1">
                              {r.climate_controlled && <Snowflake className="h-3.5 w-3.5 text-blue-500" />}
                              {(r.security_level === "Restricted" || r.security_level === "High Security") && (
                                <Lock className="h-3.5 w-3.5 text-orange-500" />
                              )}
                            </div>
                          </div>
                          {r.location_type && (
                            <Badge variant="secondary" className={`text-[10px] border-0 ${typeColor(r.location_type)}`}>
                              {r.location_type}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">{r.work_count} works</p>
                          {r.full_location && (
                            <p className="text-[10px] font-mono text-muted-foreground truncate">{r.full_location}</p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  <button
                    className="border border-dashed rounded-lg p-4 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:border-accent hover:text-foreground transition-colors"
                    onClick={() => { setAddRoomFloor(floorKey === "__unassigned__" ? undefined : floorKey); setAddRoomOpen(true); }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Room to {floorLabel}
                  </button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {rooms.length === 0 && (
        <p className="text-muted-foreground text-center py-12">No rooms in this building yet.</p>
      )}
    </div>
  );
}

function StatChip({ icon: Icon, label, accent }: { icon: React.ElementType; label: string; accent: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-medium">
      <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
      {label}
    </div>
  );
}

function AddRoomForm({
  buildingId, buildingName, existingFloors, defaultFloor, accentColor, onDone,
}: {
  buildingId: string; buildingName: string; existingFloors: string[];
  defaultFloor?: string; accentColor: string; onDone: () => void;
}) {
  const create = useCreateRoom();
  const [form, setForm] = useState({
    floor: defaultFloor ?? "", room_name: "", room_code: "",
    location_type: "", climate_controlled: false, security_level: "Standard", notes: "",
  });

  const save = async () => {
    const fullLocation = [buildingName, form.floor, form.room_name].filter(Boolean).join(" : ");
    await create.mutateAsync({
      building_id: buildingId, building: buildingName,
      floor: form.floor || undefined, room_name: form.room_name || undefined,
      room_code: form.room_code || undefined, full_location: fullLocation,
      location_type: form.location_type || undefined, climate_controlled: form.climate_controlled,
      security_level: form.security_level, notes: form.notes || undefined,
    });
    toast.success(`Room added to ${form.floor || "building"}`);
    onDone();
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Building</Label><Input value={buildingName} disabled /></div>
      <div>
        <Label className="text-xs">Floor</Label>
        <Input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="e.g. First Floor" list="floor-suggestions" />
        <datalist id="floor-suggestions">{existingFloors.map((f) => <option key={f} value={f} />)}</datalist>
      </div>
      <div><Label className="text-xs">Room name</Label><Input value={form.room_name} onChange={(e) => setForm({ ...form, room_name: e.target.value })} /></div>
      <div><Label className="text-xs">Room code</Label><Input value={form.room_code} onChange={(e) => setForm({ ...form, room_code: e.target.value })} /></div>
      <div>
        <Label className="text-xs">Location type</Label>
        <Select value={form.location_type} onValueChange={(v) => setForm({ ...form, location_type: v })}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>{LOCATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.climate_controlled} onCheckedChange={(v) => setForm({ ...form, climate_controlled: v })} />
        <Label className="text-xs">Climate controlled</Label>
      </div>
      <div>
        <Label className="text-xs">Security level</Label>
        <Select value={form.security_level} onValueChange={(v) => setForm({ ...form, security_level: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{SECURITY_LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
      <Button onClick={save} disabled={create.isPending} className="w-full" style={{ backgroundColor: accentColor, color: "#fff" }}>Add Room</Button>
    </div>
  );
}

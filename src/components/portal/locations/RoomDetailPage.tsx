import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Pencil, Snowflake, Lock, ArrowLeft } from "lucide-react";
import { usePortal } from "@/components/portal/PortalContext";
import { useRoomDetail, useRoomWorks, useUpdateRoom } from "@/hooks/useLocations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const LOCATION_TYPES = ["Gallery", "Storage", "Conservation Lab", "On Loan", "Off Site", "Registrar", "Admin", "Other"];
const SECURITY_LEVELS = ["Standard", "Restricted", "High Security"];

function typeColor(t: string | null) {
  switch (t) {
    case "Gallery": return "bg-blue-100 text-blue-800";
    case "Storage": return "bg-amber-100 text-amber-800";
    case "Conservation Lab": return "bg-purple-100 text-purple-800";
    case "On Loan": case "Off Site": return "bg-gray-100 text-gray-600";
    default: return "bg-muted text-muted-foreground";
  }
}

export function RoomDetailPage() {
  const { id: buildingId, locationId } = useParams<{ id: string; locationId: string }>();
  const { accentColor, basePath } = usePortal();
  const { data: room, isLoading } = useRoomDetail(locationId);
  const { data: works, isLoading: worksLoading } = useRoomWorks(locationId);
  const updateRoom = useUpdateRoom();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  if (isLoading) return <p className="text-muted-foreground p-6">Loading…</p>;
  if (!room) return <p className="text-muted-foreground p-6">Room not found.</p>;

  const startEdit = () => {
    setForm({
      room_name: room.room_name ?? "",
      room_code: room.room_code ?? "",
      floor: room.floor ?? "",
      location_type: room.location_type ?? "",
      climate_controlled: room.climate_controlled ?? false,
      security_level: room.security_level ?? "Standard",
      notes: room.notes ?? "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const fullLocation = [room.building, form.floor, form.room_name].filter(Boolean).join(" : ");
    await updateRoom.mutateAsync({
      id: room.id,
      room_name: (form.room_name as string) || null,
      room_code: (form.room_code as string) || null,
      floor: (form.floor as string) || null,
      location_type: (form.location_type as string) || null,
      climate_controlled: form.climate_controlled as boolean,
      security_level: form.security_level as string,
      notes: (form.notes as string) || null,
      full_location: fullLocation,
    });
    toast.success("Room updated");
    setEditing(false);
  };

  const workCount = works?.length ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link to={`${basePath}/locations`} className="hover:underline" style={{ color: accentColor }}>Locations</Link>
        <span>›</span>
        <Link to={`${basePath}/locations/${buildingId}`} className="hover:underline" style={{ color: accentColor }}>{room.building}</Link>
        {room.floor && <><span>›</span><span>{room.floor}</span></>}
        <span>›</span>
        <span className="text-foreground font-medium">{room.room_name || "Unnamed room"}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{room.room_name || "Unnamed room"}</h1>
            {room.location_type && (
              <Badge variant="secondary" className={`border-0 ${typeColor(room.location_type)}`}>
                {room.location_type}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{workCount} works in this room</p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={saveEdit} disabled={updateRoom.isPending}
                style={{ backgroundColor: accentColor, color: "#fff" }}>Save</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit Room
            </Button>
          )}
        </div>
      </div>

      <Link to={`${basePath}/locations/${buildingId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {room.building}
      </Link>

      {/* Edit form */}
      {editing && (
        <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className="text-xs">Room name</Label><Input value={form.room_name as string} onChange={(e) => setForm({ ...form, room_name: e.target.value })} /></div>
          <div><Label className="text-xs">Room code</Label><Input value={form.room_code as string} onChange={(e) => setForm({ ...form, room_code: e.target.value })} /></div>
          <div><Label className="text-xs">Floor</Label><Input value={form.floor as string} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></div>
          <div>
            <Label className="text-xs">Location type</Label>
            <Select value={form.location_type as string} onValueChange={(v) => setForm({ ...form, location_type: v })}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{LOCATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.climate_controlled as boolean} onCheckedChange={(v) => setForm({ ...form, climate_controlled: v })} />
            <Label className="text-xs">Climate controlled</Label>
          </div>
          <div>
            <Label className="text-xs">Security level</Label>
            <Select value={form.security_level as string} onValueChange={(v) => setForm({ ...form, security_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SECURITY_LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2"><Label className="text-xs">Notes</Label><Textarea value={form.notes as string} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
        </div>
      )}

      {/* Works grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Works in this room</h2>
        {worksLoading ? (
          <p className="text-muted-foreground text-sm">Loading works…</p>
        ) : workCount === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No works currently in this room</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {works!.map((w) => (
              <Link key={w.id} to={`${basePath}/works/${w.id}`}>
                <Card className="cursor-pointer hover:border-accent transition-colors h-full">
                  <CardContent className="p-3 flex gap-3">
                    <div className="w-[60px] h-[60px] rounded bg-muted flex-shrink-0 overflow-hidden">
                      {w.image_url ? (
                        <img src={w.image_url} alt={w.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">No img</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-medium line-clamp-2 leading-tight">{w.title}</p>
                      {w.artist_name && <p className="text-xs text-muted-foreground truncate">{w.artist_name}</p>}
                      {w.accession_number && <p className="text-[10px] font-mono text-muted-foreground">{w.accession_number}</p>}
                      <div className="flex items-center gap-1.5">
                        {w.classification && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{w.classification}</Badge>
                        )}
                        <span className={`inline-block h-2 w-2 rounded-full ${w.is_on_display ? "bg-green-500" : "bg-gray-300"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Room info panel */}
      <Separator />
      <div className="space-y-2 text-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Room Info</h3>
        {room.full_location && <p className="font-mono text-xs text-muted-foreground">{room.full_location}</p>}
        <div className="flex flex-wrap gap-3">
          {room.location_type && (
            <Badge variant="secondary" className={`border-0 ${typeColor(room.location_type)}`}>{room.location_type}</Badge>
          )}
          {room.climate_controlled && (
            <span className="inline-flex items-center gap-1 text-xs"><Snowflake className="h-3.5 w-3.5 text-blue-500" /> Climate controlled</span>
          )}
          {room.security_level && room.security_level !== "Standard" && (
            <span className="inline-flex items-center gap-1 text-xs"><Lock className="h-3.5 w-3.5 text-orange-500" /> {room.security_level}</span>
          )}
        </div>
        {room.notes && <p className="text-muted-foreground text-xs">{room.notes}</p>}
      </div>
    </div>
  );
}

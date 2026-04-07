import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, DoorOpen, Image, Plus, Pencil, Check, X } from "lucide-react";
import { usePortal } from "@/components/portal/PortalContext";
import { useBuildingsIndex, useCreateBuilding, useUpdateBuilding, type BuildingWithStats } from "@/hooks/useLocations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export function BuildingsListPage() {
  const { accentColor, basePath } = usePortal();
  const navigate = useNavigate();
  const { data: buildings, isLoading } = useBuildingsIndex();
  const [addOpen, setAddOpen] = useState(false);

  const totalRooms = buildings?.reduce((s, b) => s + b.room_count, 0) ?? 0;
  const totalWorks = buildings?.reduce((s, b) => s + b.work_count, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Locations</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: accentColor, color: "#fff" }}>
              <Plus className="h-4 w-4 mr-1" /> Add Building
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Building</DialogTitle></DialogHeader>
            <BuildingForm accentColor={accentColor} onDone={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <StatChip icon={Building2} label={`${buildings?.length ?? 0} Buildings`} accent={accentColor} />
        <StatChip icon={DoorOpen} label={`${totalRooms} Rooms`} accent={accentColor} />
        <StatChip icon={Image} label={`${totalWorks} Works placed`} accent={accentColor} />
      </div>

      {/* Grid */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buildings?.map((b) => (
            <BuildingCard key={b.id} building={b} accentColor={accentColor} basePath={basePath} navigate={navigate} />
          ))}
        </div>
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

function BuildingCard({
  building: b,
  accentColor,
  basePath,
  navigate,
}: {
  building: BuildingWithStats;
  accentColor: string;
  basePath: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <Card
      className="relative group cursor-pointer hover:border-accent transition-colors"
      style={{ "--accent-border": accentColor } as React.CSSProperties}
      onClick={() => !editing && navigate(`${basePath}/locations/${b.id}`)}
    >
      {/* Edit trigger */}
      <button
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted z-10"
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      >
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </button>

      <CardContent className="p-5 space-y-3">
        {editing ? (
          <InlineEditBuilding building={b} accentColor={accentColor} onClose={() => setEditing(false)} />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${b.is_active ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="font-semibold text-base">{b.name}</span>
              {b.short_name && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-0">{b.short_name}</Badge>
              )}
            </div>

            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{b.room_count} rooms</span>
              <span>{b.work_count} works</span>
              <span>{b.floors.length} floors</span>
            </div>

            {b.floors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {b.floors.map((f) => (
                  <Badge key={f} variant="outline" className="text-[10px] font-normal">{f}</Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {b.address || b.campus_area || "—"}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InlineEditBuilding({ building, accentColor, onClose }: { building: BuildingWithStats; accentColor: string; onClose: () => void }) {
  const update = useUpdateBuilding();
  const [form, setForm] = useState({
    name: building.name,
    short_name: building.short_name ?? "",
    address: building.address ?? "",
    campus_area: building.campus_area ?? "",
    description: building.description ?? "",
    notes: building.notes ?? "",
    is_active: building.is_active ?? true,
  });

  const save = async () => {
    await update.mutateAsync({ id: building.id, ...form, short_name: form.short_name || null, address: form.address || null, campus_area: form.campus_area || null, description: form.description || null, notes: form.notes || null });
    toast.success("Building updated");
    onClose();
  };

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input placeholder="Short name" value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
      <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <Input placeholder="Campus area" value={form.campus_area} onChange={(e) => setForm({ ...form, campus_area: e.target.value })} />
      <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      <div className="flex items-center gap-2">
        <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
        <Label className="text-xs">Active</Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={save} disabled={!form.name || update.isPending} style={{ backgroundColor: accentColor, color: "#fff" }}>
          <Check className="h-3 w-3 mr-1" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}><X className="h-3 w-3 mr-1" /> Cancel</Button>
      </div>
    </div>
  );
}

function BuildingForm({ accentColor, onDone }: { accentColor: string; onDone: () => void }) {
  const create = useCreateBuilding();
  const [form, setForm] = useState({
    name: "",
    short_name: "",
    address: "",
    campus_area: "",
    description: "",
    notes: "",
    is_active: true,
  });

  const save = async () => {
    await create.mutateAsync({ ...form, short_name: form.short_name || undefined, address: form.address || undefined, campus_area: form.campus_area || undefined, description: form.description || undefined, notes: form.notes || undefined });
    toast.success("Building added");
    onDone();
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Short name</Label>
        <Input value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Address</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Campus area</Label>
        <Input value={form.campus_area} onChange={(e) => setForm({ ...form, campus_area: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
        <Label className="text-xs">Active</Label>
      </div>
      <Button onClick={save} disabled={!form.name || create.isPending} className="w-full" style={{ backgroundColor: accentColor, color: "#fff" }}>
        Add Building
      </Button>
    </div>
  );
}

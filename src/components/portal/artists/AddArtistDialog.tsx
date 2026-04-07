import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { usePortal } from "@/components/portal/PortalContext";
import { useCreateArtist } from "@/hooks/useArtists";
import { Loader2 } from "lucide-react";

interface AddArtistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddArtistDialog = ({ open, onOpenChange }: AddArtistDialogProps) => {
  const navigate = useNavigate();
  const portal = usePortal();
  const createArtist = useCreateArtist();

  const [form, setForm] = useState({
    display_name: "",
    given_name: "",
    family_name: "",
    nationality: "",
    birth_year: "",
    death_year: "",
    is_isu_affiliated: false,
    bio: "",
  });

  const set = (key: string, val: string | boolean) =>
    setForm((p) => ({ ...p, [key]: val }));

  const reset = () => {
    setForm({
      display_name: "", given_name: "", family_name: "",
      nationality: "", birth_year: "", death_year: "",
      is_isu_affiliated: false, bio: "",
    });
  };

  const handleSave = () => {
    if (!form.display_name.trim()) {
      toast.error("Display name is required");
      return;
    }
    createArtist.mutate(
      {
        display_name: form.display_name.trim(),
        given_name: form.given_name.trim() || undefined,
        family_name: form.family_name.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
        birth_year: form.birth_year ? parseInt(form.birth_year) : null,
        death_year: form.death_year ? parseInt(form.death_year) : null,
        is_isu_affiliated: form.is_isu_affiliated,
        bio: form.bio.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          toast.success("Artist added");
          reset();
          onOpenChange(false);
          navigate(`${portal.basePath}/artists/${result.id}`);
        },
        onError: (err) => toast.error(`Failed: ${err.message}`),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Artist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Display Name *</Label>
            <Input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} className="h-8 text-sm mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Given Name</Label>
              <Input value={form.given_name} onChange={(e) => set("given_name", e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Family Name</Label>
              <Input value={form.family_name} onChange={(e) => set("family_name", e.target.value)} className="h-8 text-sm mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Nationality</Label>
            <Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} className="h-8 text-sm mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Birth Year</Label>
              <Input type="number" value={form.birth_year} onChange={(e) => set("birth_year", e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Death Year</Label>
              <Input type="number" value={form.death_year} onChange={(e) => set("death_year", e.target.value)} className="h-8 text-sm mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_isu_affiliated} onCheckedChange={(v) => set("is_isu_affiliated", v)} />
            <Label className="text-xs">ISU Affiliated</Label>
          </div>
          <div>
            <Label className="text-xs">Bio</Label>
            <Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} className="text-sm mt-1 min-h-[80px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={createArtist.isPending} className="gap-1.5">
            {createArtist.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

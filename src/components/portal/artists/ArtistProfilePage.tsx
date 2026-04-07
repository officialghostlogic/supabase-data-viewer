import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Pencil, Trash2, Save, X, Loader2, ExternalLink, Globe, Users as UsersIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePortal } from "@/components/portal/PortalContext";
import {
  useArtistDetail, useArtistWorks, useArtistConditionSummary,
  useUpdateArtist, useDeleteArtist,
} from "@/hooks/useArtists";

const classColors: Record<string, string> = {
  Painting: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Sculpture: "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300",
  Print: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  Drawing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Photograph: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  Photography: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  Ceramic: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Mixed Media": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  Textile: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[120px_1fr] gap-2 items-start py-1.5">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-1">{label}</span>
    <div>{children}</div>
  </div>
);

export const ArtistProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const portal = usePortal();
  const base = portal.basePath;

  const { data: artist, isLoading } = useArtistDetail(id!);
  const { data: works } = useArtistWorks(id!);
  const { data: condSummary } = useArtistConditionSummary(id!);
  const updateArtist = useUpdateArtist();
  const deleteArtist = useDeleteArtist();

  const [editing, setEditing] = useState(false);
  const [draft, setDraftState] = useState<Record<string, unknown>>({});
  const setDraft = useCallback((k: string, v: unknown) => setDraftState((p) => ({ ...p, [k]: v })), []);

  const startEditing = () => {
    if (!artist) return;
    setDraftState({
      display_name: artist.display_name,
      name_raw: artist.name_raw ?? "",
      nationality: artist.nationality ?? "",
      birth_year: artist.birth_year ?? "",
      death_year: artist.death_year ?? "",
      is_isu_affiliated: artist.is_isu_affiliated ?? false,
      bio: artist.bio ?? "",
      ulan_id: artist.ulan_id ?? "",
      website_url: artist.website_url ?? "",
    });
    setEditing(true);
  };

  const cancelEditing = () => { setEditing(false); setDraftState({}); };

  const saveChanges = () => {
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(draft)) {
      const orig = (artist as Record<string, unknown>)[k];
      const cleaned = v === "" ? null : (k === "birth_year" || k === "death_year") ? (v ? Number(v) : null) : v;
      if (cleaned !== orig) updates[k] = cleaned;
    }
    if (!Object.keys(updates).length) { toast("No changes"); setEditing(false); return; }
    updateArtist.mutate(
      { id: id!, updates },
      {
        onSuccess: () => { toast.success("Artist saved"); setEditing(false); setDraftState({}); },
        onError: (err) => toast.error(`Save failed: ${err.message}`),
      }
    );
  };

  const handleDelete = () => {
    deleteArtist.mutate(id!, {
      onSuccess: () => { toast.success("Artist deleted"); navigate(`${base}/artists`); },
      onError: (err) => toast.error(`Delete failed: ${err.message}`),
    });
  };

  if (isLoading || !artist) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const workCount = works?.length ?? 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to={`${base}/artists`} className="hover:text-foreground transition-colors">Artists</Link>
        <span>›</span>
        <span className="text-foreground truncate max-w-[300px]">{artist.display_name}</span>
      </nav>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        {/* Left column — artist info */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground font-display">{artist.display_name}</h1>
                {artist.is_isu_affiliated && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider bg-secondary/20 text-secondary border border-secondary/30 mt-2">
                    ISU Affiliated
                  </span>
                )}
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEditing} className="gap-1"><X className="h-3.5 w-3.5" /> Cancel</Button>
                  <Button size="sm" onClick={saveChanges} disabled={updateArtist.isPending} className="gap-1">
                    {updateArtist.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={startEditing} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
            </div>

            <div className="space-y-1">
              <Field label="Display Name">
                {editing ? <Input value={String(draft.display_name ?? "")} onChange={(e) => setDraft("display_name", e.target.value)} className="h-8 text-sm" /> : <span className="text-sm text-card-foreground font-semibold">{artist.display_name}</span>}
              </Field>
              <Field label="Name (raw)">
                {editing ? <Input value={String(draft.name_raw ?? "")} onChange={(e) => setDraft("name_raw", e.target.value)} className="h-8 text-sm" /> : <span className="text-sm text-muted-foreground">{artist.name_raw || "—"}</span>}
              </Field>
              <Field label="Nationality">
                {editing ? <Input value={String(draft.nationality ?? "")} onChange={(e) => setDraft("nationality", e.target.value)} className="h-8 text-sm" /> : <span className="text-sm text-card-foreground">{artist.nationality || "—"}</span>}
              </Field>
              <Field label="Birth Year">
                {editing ? <Input type="number" value={String(draft.birth_year ?? "")} onChange={(e) => setDraft("birth_year", e.target.value)} className="h-8 text-sm w-24" /> : <span className="text-sm text-card-foreground">{artist.birth_year ?? "—"}</span>}
              </Field>
              <Field label="Death Year">
                {editing ? <Input type="number" value={String(draft.death_year ?? "")} onChange={(e) => setDraft("death_year", e.target.value)} className="h-8 text-sm w-24" /> : <span className="text-sm text-card-foreground">{artist.death_year ?? "—"}</span>}
              </Field>
              <Field label="ISU Affiliated">
                {editing ? <Switch checked={!!draft.is_isu_affiliated} onCheckedChange={(v) => setDraft("is_isu_affiliated", v)} /> : <span className={`inline-block h-2.5 w-2.5 rounded-full ${artist.is_isu_affiliated ? "bg-secondary" : "bg-gray-300 dark:bg-gray-600"}`} />}
              </Field>
              <Field label="Bio">
                {editing ? <Textarea value={String(draft.bio ?? "")} onChange={(e) => setDraft("bio", e.target.value)} className="text-sm min-h-[80px]" /> : <span className="text-sm text-card-foreground whitespace-pre-wrap">{artist.bio || "—"}</span>}
              </Field>
              <Field label="ULAN ID">
                {editing ? (
                  <Input value={String(draft.ulan_id ?? "")} onChange={(e) => setDraft("ulan_id", e.target.value)} className="h-8 text-sm" />
                ) : artist.ulan_id ? (
                  <a href={`https://vocab.getty.edu/ulan/${artist.ulan_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    {artist.ulan_id} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : <span className="text-sm text-muted-foreground">—</span>}
              </Field>
              <Field label="Website">
                {editing ? (
                  <Input value={String(draft.website_url ?? "")} onChange={(e) => setDraft("website_url", e.target.value)} className="h-8 text-sm" />
                ) : artist.website_url ? (
                  <a href={artist.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    Visit <Globe className="h-3 w-3" />
                  </a>
                ) : <span className="text-sm text-muted-foreground">—</span>}
              </Field>
            </div>
          </div>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Delete Artist
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {artist.display_name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  {workCount > 0
                    ? `This artist has ${workCount} works in the collection. Deleting will unlink them (works remain but lose artist link). Continue?`
                    : "This cannot be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Right column — works */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-card-foreground font-display mb-4">
              Works in the Collection ({workCount})
            </h2>

            {workCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No works currently linked to this artist.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {works?.map((work) => (
                  <Link
                    key={work.id}
                    to={`${base}/works/${work.id}`}
                    className="rounded-lg border border-border bg-background p-4 space-y-1.5 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-sm font-semibold text-card-foreground line-clamp-1">{work.title}</h3>
                    {work.date_created && (
                      <p className="text-xs text-muted-foreground">{work.date_created}</p>
                    )}
                    <div className="flex items-center gap-2">
                      {work.classification && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${classColors[work.classification] || "bg-gray-100 text-gray-800"}`}>
                          {work.classification}
                        </span>
                      )}
                    </div>
                    {work.medium && (
                      <p className="text-xs text-muted-foreground truncate">{work.medium}</p>
                    )}
                    {work.accession_number && (
                      <p className="font-mono text-[10px] text-muted-foreground/60">{work.accession_number}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Condition summary */}
          {condSummary && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-card-foreground mb-2">Condition Summary</h2>
              <p className="text-sm text-muted-foreground">
                {condSummary.totalAssessed} work{condSummary.totalAssessed !== 1 ? "s" : ""} assessed
                {" — "}
                {Object.entries(condSummary.conditions)
                  .map(([cond, count]) => `${count} ${cond}`)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

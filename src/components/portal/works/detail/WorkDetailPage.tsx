import { useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Pencil, Trash2, ChevronLeft, ChevronRight, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePortal } from "@/components/portal/PortalContext";
import {
  useWorkDetail,
  useWorkAssets,
  useLatestCondition,
  useUpdateWork,
  useDeleteWork,
  useAdjacentWorks,
  useAllArtists,
} from "@/hooks/useWorkDetail";
import { ImagePanel } from "./ImagePanel";
import { ImportFlagsPanel } from "./ImportFlagsPanel";
import { ConditionCard } from "./ConditionCard";
import { MetadataSections } from "./MetadataSections";

export const WorkDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const portal = usePortal();
  const isAdmin = portal.role === "admin";
  const base = portal.basePath;

  const { data, isLoading, error } = useWorkDetail(id!);
  const { data: assets } = useWorkAssets(id!);
  const { data: condition } = useLatestCondition(id!);
  const { data: adjacent } = useAdjacentWorks(id!);
  const { data: allArtists } = useAllArtists();
  const updateWork = useUpdateWork();
  const deleteWork = useDeleteWork();

  const [editing, setEditing] = useState(false);
  const [draft, setDraftState] = useState<Record<string, unknown>>({});

  const setDraft = useCallback((key: string, value: unknown) => {
    setDraftState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const startEditing = () => {
    if (!data?.work) return;
    const w = data.work;
    setDraftState({
      title: w.title,
      accession_number: w.accession_number ?? "",
      barcode: w.barcode ?? "",
      artist_id: w.artist_id ?? "",
      medium: w.medium ?? "",
      classification: w.classification ?? "",
      date_acquired: w.date_acquired ?? "",
      dimensions_h: w.dimensions_h,
      dimensions_w: w.dimensions_w,
      dimensions_d: w.dimensions_d,
      rights_status: w.rights_status ?? "",
      is_on_display: w.is_on_display ?? false,
      credit_line: w.credit_line ?? "",
      provenance: w.provenance ?? "",
      notes: w.notes ?? "",
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraftState({});
  };

  const saveChanges = () => {
    const updates: Record<string, unknown> = {};
    const w = data!.work;
    for (const [key, val] of Object.entries(draft)) {
      const original = (w as Record<string, unknown>)[key];
      const cleaned = val === "" ? null : val;
      if (cleaned !== original) {
        updates[key] = cleaned;
      }
    }
    if (Object.keys(updates).length === 0) {
      toast("No changes to save");
      setEditing(false);
      return;
    }
    updateWork.mutate(
      { id: id!, updates },
      {
        onSuccess: () => {
          toast.success("Work saved");
          setEditing(false);
          setDraftState({});
        },
        onError: (err) => toast.error(`Save failed: ${err.message}`),
      }
    );
  };

  const handleDelete = () => {
    deleteWork.mutate(id!, {
      onSuccess: () => {
        toast.success("Work deleted");
        navigate(`${base}/works`);
      },
      onError: (err) => toast.error(`Delete failed: ${err.message}`),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-24">
        <p className="text-destructive">Work not found</p>
        <Button variant="link" onClick={() => navigate(`${base}/works`)}>← Back to works</Button>
      </div>
    );
  }

  const { work, artist, location, building } = data;

  const statusStyles: Record<string, string> = {
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    needs_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400",
    archived: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to={`${base}/works`} className="hover:text-foreground transition-colors">
          Works
        </Link>
        <span>›</span>
        <span className="text-foreground truncate max-w-[300px]">{work.title}</span>
      </nav>

      {/* Top bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-2xl font-bold text-foreground font-display truncate">
            {work.title}
          </h1>
          {work.import_status && (
            <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyles[work.import_status] || "bg-gray-100 text-gray-700"}`}>
              {work.import_status.replace("_", " ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={saveChanges} disabled={updateWork.isPending} className="gap-1.5">
                {updateWork.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{work.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This cannot be undone. The work and all associated records will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <ImagePanel assets={assets ?? []} classification={work.classification} />

          {work.import_flags && work.import_flags.length > 0 && (
            <ImportFlagsPanel workId={work.id} flags={work.import_flags} />
          )}

          {condition && <ConditionCard report={condition} workId={work.id} />}
        </div>

        {/* Right column */}
        <div className="rounded-xl border border-border bg-card p-6">
          <MetadataSections
            work={work}
            artist={artist}
            location={location}
            building={building}
            editing={editing}
            draft={draft}
            setDraft={setDraft}
            allArtists={allArtists ?? []}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {adjacent?.prev ? (
          <Link
            to={`${base}/works/${adjacent.prev.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="truncate max-w-[200px]">{adjacent.prev.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {adjacent?.next ? (
          <Link
            to={`${base}/works/${adjacent.next.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="truncate max-w-[200px]">{adjacent.next.title}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

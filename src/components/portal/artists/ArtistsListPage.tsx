import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, X, ExternalLink, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePortal } from "@/components/portal/PortalContext";
import { useArtistsList, useDeleteArtist, type ArtistWithCount } from "@/hooks/useArtists";
import { AddArtistDialog } from "@/components/portal/artists/AddArtistDialog";
import { SelectionActionBar } from "@/components/portal/shared/SelectionActionBar";
import { DeleteArtistsDialog } from "@/components/portal/shared/DeleteArtistsDialog";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

const getFirstLetter = (name: string) => {
  const ch = name.charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
};

export const ArtistsListPage = () => {
  const navigate = useNavigate();
  const portal = usePortal();
  const { data: artists, isLoading } = useArtistsList();
  const deleteArtist = useDeleteArtist();
  const isAdmin = portal.role === "admin";

  const [search, setSearch] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArtistWithCount | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDelete, setShowBatchDelete] = useState(false);

  // Which letters have artists
  const lettersWithArtists = useMemo(() => {
    const s = new Set<string>();
    artists?.forEach((a) => s.add(getFirstLetter(a.display_name)));
    return s;
  }, [artists]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = artists ?? [];
    if (activeLetter) {
      list = list.filter((a) => getFirstLetter(a.display_name) === activeLetter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.display_name.toLowerCase().includes(q) ||
          (a.given_name?.toLowerCase().includes(q)) ||
          (a.family_name?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [artists, activeLetter, search]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, activeLetter]);

  // Escape key clears selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIds(new Set());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filtered.map((a) => a.id)));
  }, [filtered]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteArtist.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Artist deleted"); setDeleteTarget(null); },
      onError: (err) => toast.error(`Delete failed: ${err.message}`),
    });
  };

  const lifespan = (a: ArtistWithCount) => {
    if (a.birth_year && a.death_year) return `${a.birth_year}–${a.death_year}`;
    if (a.birth_year) return `b. ${a.birth_year}`;
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground font-display">Artists</h1>
          {!isLoading && (
            <Badge variant="secondary" className="text-xs font-medium tabular-nums">
              {artists?.length ?? 0} artists
            </Badge>
          )}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Artist
        </Button>
      </div>

      {/* Alpha nav */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setActiveLetter(null)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
            activeLetter === null
              ? "text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={activeLetter === null ? { backgroundColor: portal.accentColor } : undefined}
        >
          All
        </button>
        {LETTERS.map((letter) => {
          const has = lettersWithArtists.has(letter);
          const active = activeLetter === letter;
          return (
            <button
              key={letter}
              onClick={() => has && setActiveLetter(active ? null : letter)}
              disabled={!has}
              className={`w-7 h-7 text-xs font-semibold rounded-md transition-all ${
                active
                  ? "text-white shadow-sm"
                  : has
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                  : "text-muted-foreground/30 cursor-not-allowed"
              }`}
              style={active ? { backgroundColor: portal.accentColor } : undefined}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Input
          placeholder="Search artists…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 text-sm pl-3"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Selection action bar (admin only) */}
      {isAdmin && selectedIds.size > 0 && (
        <SelectionActionBar
          count={selectedIds.size}
          totalCount={filtered.length}
          allPageSelected={filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id))}
          hasMorePages={false}
          onSelectAll={selectAllFiltered}
          onClear={clearSelection}
          onDelete={() => setShowBatchDelete(true)}
          label="artists"
        />
      )}

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card">
          <SearchX className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <p className="text-base font-medium text-foreground mb-1">No artists match</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setActiveLetter(null); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((artist) => (
            <div
              key={artist.id}
              onClick={() => navigate(`${portal.basePath}/artists/${artist.id}`)}
              className={`group relative rounded-xl border border-border bg-card p-5 cursor-pointer transition-all hover:shadow-md ${
                selectedIds.has(artist.id) ? "ring-2 ring-accent bg-accent/5" : ""
              }`}
              style={{ ["--hover-border" as string]: portal.accentColor }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = portal.accentColor)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
            >
              {/* Admin checkbox */}
              {isAdmin && (
                <div
                  className="absolute top-3 left-3 z-10"
                  onClick={(e) => toggleSelect(artist.id, e)}
                >
                  <Checkbox
                    checked={selectedIds.has(artist.id)}
                    aria-label={`Select ${artist.display_name}`}
                    className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity"
                  />
                </div>
              )}

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(artist); }}
                className="absolute top-3 right-3 p-1 rounded text-muted-foreground/0 group-hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className={`space-y-2 ${isAdmin ? "pl-6" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-card-foreground">{artist.display_name}</span>
                  {artist.is_isu_affiliated && (
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider bg-secondary/20 text-secondary border border-secondary/30">
                      ISU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {artist.nationality && <span>{artist.nationality}</span>}
                  {artist.nationality && lifespan(artist) && <span>·</span>}
                  {lifespan(artist) && <span>{lifespan(artist)}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {artist.work_count} work{artist.work_count !== 1 ? "s" : ""} in collection
                  </span>
                  {artist.ulan_id && (
                    <a
                      href={`https://vocab.getty.edu/ulan/${artist.ulan_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.work_count > 0
                ? `This artist has ${deleteTarget.work_count} works in the collection. Deleting will unlink them (works remain but lose artist link). Continue?`
                : "This cannot be undone."}
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

      {/* Batch delete dialog */}
      <DeleteArtistsDialog
        open={showBatchDelete}
        onOpenChange={setShowBatchDelete}
        selectedIds={Array.from(selectedIds)}
        artists={(artists ?? []).map((a) => ({ id: a.id, display_name: a.display_name }))}
        onDeleted={clearSelection}
      />

      {/* Add artist dialog */}
      <AddArtistDialog open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
};

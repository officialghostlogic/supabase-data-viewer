import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { Trash2, RotateCcw, AlertTriangle, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useTrashCounts,
  useTrashItems,
  useRestoreRecord,
  usePermanentDelete,
  useBulkRestore,
  useBulkPermanentDelete,
} from "@/hooks/useTrash";

type TrashTable = "works" | "artists" | "locations" | "buildings";

export function TrashPage() {
  const [activeTab, setActiveTab] = useState<TrashTable>("works");
  const { data: counts } = useTrashCounts();
  const { data: items, isLoading } = useTrashItems(activeTab);
  const restore = useRestoreRecord();
  const permDelete = usePermanentDelete();
  const bulkRestore = useBulkRestore();
  const bulkPermDelete = useBulkPermanentDelete();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmPermDelete, setConfirmPermDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmBulkPermDelete, setConfirmBulkPermDelete] = useState(false);

  // Clear selection on tab change
  useEffect(() => { setSelectedIds(new Set()); }, [activeTab]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (!items) return;
    const allIds = items.map((i: any) => i.id);
    const allSelected = allIds.every((id: string) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  }, [items, selectedIds]);

  // Check for items nearing purge (within 10 days of 90-day limit)
  const nearingPurge = useMemo(() => {
    if (!items) return 0;
    return items.filter((i: any) => {
      const days = differenceInDays(new Date(), new Date(i.deleted_at));
      return days >= 80;
    }).length;
  }, [items]);

  const handleRestore = (id: string, name: string) => {
    restore.mutate({ table: activeTab, id }, {
      onSuccess: () => {
        toast.success(`${name} restored`);
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      },
    });
  };

  const handlePermDelete = () => {
    if (!confirmPermDelete) return;
    permDelete.mutate({ table: activeTab, id: confirmPermDelete.id }, {
      onSuccess: () => {
        toast.success("Permanently deleted");
        setConfirmPermDelete(null);
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(confirmPermDelete.id); return n; });
      },
    });
  };

  const handleBulkRestore = () => {
    bulkRestore.mutate({ table: activeTab, ids: Array.from(selectedIds) }, {
      onSuccess: () => {
        toast.success(`${selectedIds.size} records restored`);
        setSelectedIds(new Set());
      },
    });
  };

  const handleBulkPermDelete = () => {
    bulkPermDelete.mutate({ table: activeTab, ids: Array.from(selectedIds) }, {
      onSuccess: () => {
        toast.success(`${selectedIds.size} records permanently deleted`);
        setSelectedIds(new Set());
        setConfirmBulkPermDelete(false);
      },
    });
  };

  const getName = (item: any): string => {
    if (activeTab === "works") return item.title || "Untitled";
    if (activeTab === "artists") return item.display_name || "Unknown";
    if (activeTab === "locations") return item.full_location || "Unknown location";
    if (activeTab === "buildings") return item.name || "Unknown building";
    return "Unknown";
  };

  const tabLabel = (table: TrashTable): string => {
    const c = counts?.[table] ?? 0;
    const labels: Record<TrashTable, string> = { works: "Works", artists: "Artists", locations: "Locations", buildings: "Buildings" };
    return `${labels[table]}${c > 0 ? ` (${c})` : ""}`;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Trash</h1>
        <p className="text-sm text-muted-foreground mt-1">Deleted records are permanently purged after 90 days</p>
      </div>

      {nearingPurge > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-800 dark:text-amber-300">
            ⚠ {nearingPurge} records will be permanently deleted within 10 days. Restore them now if needed.
          </span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TrashTable)}>
        <TabsList>
          <TabsTrigger value="works">{tabLabel("works")}</TabsTrigger>
          <TabsTrigger value="artists">{tabLabel("artists")}</TabsTrigger>
          <TabsTrigger value="locations">{tabLabel("locations")}</TabsTrigger>
          <TabsTrigger value="buildings">{tabLabel("buildings")}</TabsTrigger>
        </TabsList>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 py-2 px-4 mt-3 rounded-lg bg-accent/10 border border-accent/20">
            <span className="text-sm font-medium" style={{ color: "hsl(var(--accent-foreground))" }}>
              {selectedIds.size} selected
            </span>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleBulkRestore} disabled={bulkRestore.isPending}>
              <RotateCcw className="h-3.5 w-3.5" /> Restore selected
            </Button>
            <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setConfirmBulkPermDelete(true)}>
              <Skull className="h-3.5 w-3.5" /> Permanently delete selected
            </Button>
          </div>
        )}

        {(["works", "artists", "locations", "buildings"] as TrashTable[]).map((table) => (
          <TabsContent key={table} value={table}>
            {isLoading ? (
              <p className="text-muted-foreground py-8 text-center">Loading…</p>
            ) : !items || items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Trash2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No deleted {table}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="w-10 p-3">
                        <Checkbox
                          checked={items.length > 0 && items.every((i: any) => selectedIds.has(i.id))}
                          onCheckedChange={toggleAll}
                        />
                      </th>
                      {table === "works" && (
                        <>
                          <th className="text-left p-3 font-medium">Title</th>
                          <th className="text-left p-3 font-medium">Artist</th>
                          <th className="text-left p-3 font-medium">Accession</th>
                          <th className="text-left p-3 font-medium">Classification</th>
                        </>
                      )}
                      {table === "artists" && (
                        <th className="text-left p-3 font-medium">Name</th>
                      )}
                      {table === "locations" && (
                        <>
                          <th className="text-left p-3 font-medium">Full Location</th>
                          <th className="text-left p-3 font-medium">Building</th>
                        </>
                      )}
                      {table === "buildings" && (
                        <th className="text-left p-3 font-medium">Name</th>
                      )}
                      <th className="text-left p-3 font-medium">Deleted</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => {
                      const daysAgo = differenceInDays(new Date(), new Date(item.deleted_at));
                      const nearPurge = daysAgo >= 80;
                      return (
                        <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={() => toggleSelect(item.id)}
                            />
                          </td>
                          {table === "works" && (
                            <>
                              <td className="p-3 font-medium">{item.title}</td>
                              <td className="p-3 text-muted-foreground">{item.artist_name || "—"}</td>
                              <td className="p-3 font-mono text-xs">{item.accession_number || "—"}</td>
                              <td className="p-3">{item.classification || "—"}</td>
                            </>
                          )}
                          {table === "artists" && (
                            <td className="p-3 font-medium">{item.display_name}</td>
                          )}
                          {table === "locations" && (
                            <>
                              <td className="p-3 font-medium">{item.full_location || "—"}</td>
                              <td className="p-3 text-muted-foreground">{item.building || "—"}</td>
                            </>
                          )}
                          {table === "buildings" && (
                            <td className="p-3 font-medium">{item.name}</td>
                          )}
                          <td className="p-3 text-muted-foreground">
                            <span className={nearPurge ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
                              {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
                            </span>
                            {nearPurge && (
                              <Badge variant="outline" className="ml-2 text-[9px] text-amber-600 border-amber-300">
                                Purge soon
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 h-7 text-xs"
                                onClick={() => handleRestore(item.id, getName(item))}
                                disabled={restore.isPending}
                              >
                                <RotateCcw className="h-3 w-3" /> Restore
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1 h-7 text-xs"
                                onClick={() => setConfirmPermDelete({ id: item.id, name: getName(item) })}
                              >
                                <Skull className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Single permanent delete confirmation */}
      <AlertDialog open={!!confirmPermDelete} onOpenChange={(o) => !o && setConfirmPermDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete "{confirmPermDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Ever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk permanent delete confirmation */}
      <AlertDialog open={confirmBulkPermDelete} onOpenChange={setConfirmBulkPermDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete {selectedIds.size} records?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkPermDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Permanently Delete {selectedIds.size} Records
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
